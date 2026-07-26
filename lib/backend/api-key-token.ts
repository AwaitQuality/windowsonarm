/**
 * Token primitives for API keys: format, generation, digesting, and extraction
 * from a request.
 *
 * Deliberately dependency-free — no Prisma, no Zod. The edge middleware imports
 * `requestCarriesApiKey` from here, and anything this module pulls in is pulled
 * into the middleware bundle with it.
 */

/**
 * Tokens look like `woa_<prefix>_<secret>`.
 *
 * The prefix is stored in plaintext and carries a unique index, so a presented
 * token resolves to one candidate row without scanning. The secret is only ever
 * compared as a digest.
 */
const TOKEN_NAMESPACE = "woa";
const PREFIX_BYTES = 6; // 12 hex chars — long enough to stay collision-free.
const SECRET_BYTES = 32; // 256 bits of entropy.

export const TOKEN_PATTERN = /^woa_[0-9a-f]{12}_[0-9a-f]{64}$/;

const toHex = (bytes: Uint8Array): string =>
  Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");

const randomHex = (byteLength: number): string =>
  toHex(crypto.getRandomValues(new Uint8Array(byteLength)));

/** SHA-256 of the full token, lower-case hex. */
export const hashToken = async (token: string): Promise<string> => {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(token)
  );
  return toHex(new Uint8Array(digest));
};

/**
 * Length-independent, branch-free comparison. Both operands are SHA-256 hex
 * digests of the same fixed length, but comparing with `===` would still leak a
 * timing signal proportional to the shared prefix length.
 */
export const timingSafeEqual = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false;

  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
};

export interface GeneratedToken {
  token: string;
  prefix: string;
  hash: string;
}

export const generateToken = async (): Promise<GeneratedToken> => {
  const prefix = randomHex(PREFIX_BYTES);
  const secret = randomHex(SECRET_BYTES);
  const token = `${TOKEN_NAMESPACE}_${prefix}_${secret}`;

  return { token, prefix, hash: await hashToken(token) };
};

/** The prefix half of a well-formed token, or null if it is not well-formed. */
export const readTokenPrefix = (token: string): string | null =>
  TOKEN_PATTERN.test(token) ? token.split("_")[1] : null;

/**
 * Pulls a token off a request.
 *
 * Both `Authorization: Bearer <token>` and `X-API-Key: <token>` are accepted:
 * the former is the convention, the latter keeps the token out of the
 * Authorization header for callers whose proxies rewrite it.
 */
export const readTokenFromRequest = (request: Request): string | null => {
  const authorization = request.headers.get("authorization");

  if (authorization) {
    const parts = authorization.trim().split(/\s+/);
    const value = parts.slice(1).join("");
    if (parts[0]?.toLowerCase() === "bearer" && TOKEN_PATTERN.test(value)) {
      return value;
    }
  }

  const header = request.headers.get("x-api-key")?.trim();
  return header && TOKEN_PATTERN.test(header) ? header : null;
};

/**
 * True when the caller is presenting an API key rather than relying on a
 * session cookie. Used by the edge middleware, which must not reject a
 * key-authenticated write just because there is no Clerk session.
 */
export const requestCarriesApiKey = (request: Request): boolean =>
  readTokenFromRequest(request) !== null;
