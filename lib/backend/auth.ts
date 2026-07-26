import { NextResponse } from "next/server";
import { auth, clerkClient, User } from "@clerk/nextjs/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import ErrorResponse, {
  ErrorResponseBody,
} from "@/lib/backend/response/ErrorResponse";
import getPrisma from "@/lib/db/prisma";
import {
  readTokenFromRequest,
  touchKey,
  verifyToken,
  type VerifyFailure,
} from "@/lib/backend/api-key";
import type { ApiScope, LeafScope } from "@/lib/schemas/api-key";
import { scopeSatisfies } from "@/lib/schemas/api-key";

const ADMIN_ROLE = "admin";

/** How the caller proved they are an admin. */
export type AdminAuthMethod = "session" | "api-key";

export interface AdminContext {
  ok: true;
  userId: string;
  user: User;
  via: AdminAuthMethod;
  /** The key that authorised this request, or null for a browser session. */
  keyId: string | null;
  scopes: ApiScope[];
}

/**
 * Why an admin check failed, as a value rather than an HTTP response, so the
 * soft checks can consult the gate without manufacturing (and logging) a
 * response nobody sends.
 */
type AdminDenial =
  | { code: "unauthenticated" }
  | { code: "not-admin" }
  | { code: "key-rejected"; reason: VerifyFailure }
  | { code: "missing-scope"; scope: LeafScope };

type ResolveAdminResult = AdminContext | { ok: false; denial: AdminDenial };

export type RequireAdminResult =
  | AdminContext
  | { ok: false; response: NextResponse<ErrorResponseBody> };

const getClerkUser = async (userId: string): Promise<User | null> => {
  try {
    return await (await clerkClient()).users.getUser(userId);
  } catch (error) {
    console.error("Failed to load Clerk user:", error);
    return null;
  }
};

const isAdmin = (user: User): boolean =>
  user.publicMetadata.role === ADMIN_ROLE;

/**
 * A session carries the full authority of the account behind it, so it is
 * treated as holding every scope. Keys are the mechanism for narrowing that.
 */
const SESSION_SCOPES: ApiScope[] = ["admin:*"];

/** Messages are specific: a caller must be able to tell "wrong key" from "expired key". */
const KEY_FAILURE_MESSAGE: Record<VerifyFailure, string> = {
  malformed: "Malformed API key",
  unknown: "Invalid API key",
  revoked: "This API key has been revoked",
  expired: "This API key has expired",
};

const denialToResponse = (
  denial: AdminDenial
): NextResponse<ErrorResponseBody> => {
  switch (denial.code) {
    case "unauthenticated":
      return ErrorResponse.json("Authentication required", { status: 401 });
    case "key-rejected":
      return ErrorResponse.json(KEY_FAILURE_MESSAGE[denial.reason], {
        status: 401,
      });
    case "not-admin":
      return ErrorResponse.json("Admin access required", { status: 403 });
    case "missing-scope":
      return ErrorResponse.json(
        `This API key is missing the required scope: ${denial.scope}`,
        { status: 403 }
      );
  }
};

/**
 * Records key usage without adding a round-trip to the response path. Falls
 * back to awaiting when no execution context is available (e.g. under `next
 * dev`, which has no Workers `waitUntil`).
 */
const recordUsage = async (
  prisma: ReturnType<typeof getPrisma>,
  keyId: string,
  ctx: { waitUntil?: (promise: Promise<unknown>) => void } | undefined
): Promise<void> => {
  const write = touchKey(prisma, keyId);

  if (typeof ctx?.waitUntil === "function") {
    ctx.waitUntil(write);
    return;
  }

  await write;
};

/**
 * The API-key half of the admin gate.
 *
 * Returns null when the request presents no key at all, so the caller can fall
 * through to the session check. A key that is present but bad is a denial, never
 * a silent downgrade to the session — otherwise a caller whose key expired would
 * keep working from a stale cookie and never notice.
 */
const resolveApiKey = async (
  request: Request,
  scope: LeafScope | undefined
): Promise<ResolveAdminResult | null> => {
  const token = readTokenFromRequest(request);
  if (!token) return null;

  const { env, ctx } = await getCloudflareContext({ async: true });
  const prisma = getPrisma(env.DB);

  const verified = await verifyToken(prisma, token);

  if (!verified.ok) {
    return { ok: false, denial: { code: "key-rejected", reason: verified.reason } };
  }

  // The key's authority is derived from its owner, live. Demoting an admin in
  // Clerk therefore disables their keys immediately, with no revocation sweep.
  const user = await getClerkUser(verified.key.user_id);

  if (!user || !isAdmin(user)) {
    return { ok: false, denial: { code: "not-admin" } };
  }

  if (scope && !scopeSatisfies(verified.scopes, scope)) {
    return { ok: false, denial: { code: "missing-scope", scope } };
  }

  await recordUsage(prisma, verified.key.id, ctx);

  return {
    ok: true,
    userId: verified.key.user_id,
    user,
    via: "api-key",
    keyId: verified.key.id,
    scopes: verified.scopes,
  };
};

const resolveAdmin = async (
  request: Request | undefined,
  scope: LeafScope | undefined
): Promise<ResolveAdminResult> => {
  if (request) {
    const viaKey = await resolveApiKey(request, scope);
    if (viaKey) return viaKey;
  }

  const { userId } = await auth();

  if (!userId) {
    return { ok: false, denial: { code: "unauthenticated" } };
  }

  const user = await getClerkUser(userId);

  if (!user) {
    return { ok: false, denial: { code: "unauthenticated" } };
  }

  if (!isAdmin(user)) {
    return { ok: false, denial: { code: "not-admin" } };
  }

  return {
    ok: true,
    userId,
    user,
    via: "session",
    keyId: null,
    scopes: SESSION_SCOPES,
  };
};

/**
 * Gate for admin-only handlers, satisfied by either a Clerk session or an API
 * key. 401 means "we don't know who you are", 403 means "we do, and you may not
 * do this" — the two must not be conflated.
 *
 * Pass `request` on any handler that should be reachable by API key, and the
 * leaf scope the handler represents so narrow keys are actually narrow. Omitting
 * `request` keeps a handler session-only.
 */
export const requireAdmin = async (
  request?: Request,
  scope?: LeafScope
): Promise<RequireAdminResult> => {
  const result = await resolveAdmin(request, scope);

  return result.ok ? result : { ok: false, response: denialToResponse(result.denial) };
};

/**
 * Soft admin check for handlers where being an admin widens what you can see
 * rather than deciding whether you get in at all.
 */
export const isAdminUser = async (
  userId: string | null | undefined
): Promise<boolean> => {
  if (!userId) return false;

  const user = await getClerkUser(userId);
  return user ? isAdmin(user) : false;
};

/**
 * The request-aware counterpart of `isAdminUser`, for the same widen-the-view
 * handlers. Never produces an error response: on a public GET, a missing or bad
 * key simply means the caller does not get the admin view.
 */
export const isAdminRequest = async (
  request: Request,
  scope?: LeafScope
): Promise<boolean> => (await resolveAdmin(request, scope)).ok;
