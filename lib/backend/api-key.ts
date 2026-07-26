import type { ApiKey, PrismaClient } from "@/lib/generated/prisma/client";
import {
  ApiKeySummary,
  ApiScope,
  parseStoredScopes,
} from "@/lib/schemas/api-key";
import {
  hashToken,
  readTokenPrefix,
  timingSafeEqual,
} from "@/lib/backend/api-key-token";

export {
  generateToken,
  hashToken,
  readTokenFromRequest,
  requestCarriesApiKey,
  TOKEN_PATTERN,
  type GeneratedToken,
} from "@/lib/backend/api-key-token";

export type VerifyFailure = "malformed" | "unknown" | "revoked" | "expired";

export type VerifyTokenResult =
  | { ok: true; key: ApiKey; scopes: ApiScope[] }
  | { ok: false; reason: VerifyFailure };

/**
 * Resolves a presented token to its key row.
 *
 * Deliberately does not touch Clerk: whether the owning user is still an admin
 * is a separate question, answered by the auth gate, so this stays a pure
 * credential check.
 */
export const verifyToken = async (
  prisma: PrismaClient,
  token: string
): Promise<VerifyTokenResult> => {
  const prefix = readTokenPrefix(token);
  if (!prefix) return { ok: false, reason: "malformed" };

  const key = await prisma.apiKey.findUnique({ where: { prefix } });

  const presented = await hashToken(token);

  // The digest is computed and compared even when no row matched, so a valid
  // prefix and an unknown one cost roughly the same.
  if (!key || !timingSafeEqual(key.hash, presented)) {
    return { ok: false, reason: "unknown" };
  }

  if (key.revoked_at) return { ok: false, reason: "revoked" };
  if (key.expires_at && key.expires_at.getTime() <= Date.now()) {
    return { ok: false, reason: "expired" };
  }

  return { ok: true, key, scopes: parseStoredScopes(key.scopes) };
};

/**
 * Stamps `last_used_at`. Best-effort by design — a failed bookkeeping write
 * must never fail the request it was bookkeeping for.
 */
export const touchKey = async (
  prisma: PrismaClient,
  keyId: string
): Promise<void> => {
  try {
    await prisma.apiKey.update({
      where: { id: keyId },
      data: { last_used_at: new Date() },
    });
  } catch (error) {
    console.error("Failed to record API key usage:", error);
  }
};

/** The only shape of a key that may cross a network or component boundary. */
export const toApiKeySummary = (key: ApiKey): ApiKeySummary => ({
  id: key.id,
  name: key.name,
  prefix: key.prefix,
  scopes: parseStoredScopes(key.scopes),
  last_used_at: key.last_used_at?.toISOString() ?? null,
  expires_at: key.expires_at?.toISOString() ?? null,
  revoked_at: key.revoked_at?.toISOString() ?? null,
  created_at: key.created_at.toISOString(),
});
