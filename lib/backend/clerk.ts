import { clerkClient } from "@clerk/nextjs/server";
import type { User } from "@clerk/nextjs/server";
import type { ClerkUserSummary } from "@/lib/types/clerk";

/**
 * Clerk's `User` is a class instance, which React Server Components refuse to
 * pass to a client component ("Only plain objects ... can be passed"). Every
 * boundary therefore carries this plain summary instead.
 */
export const toClerkUserSummary = (user: User): ClerkUserSummary => ({
  username:
    user.username ??
    (`${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || undefined),
  imageUrl: user.imageUrl,
});

const LIMIT = 100;

const dedupe = (ids: (string | null | undefined)[]): string[] =>
  Array.from(new Set(ids.filter((v): v is string => Boolean(v))));

/**
 * Look up Clerk users for a batch of post user_ids. Clerk stores a primary
 * `id` and an optional `externalId`; older posts reference either, so we
 * try both and merge the result keyed by the original user_id value.
 */
export const lookupClerkUsersByIds = async (
  rawIds: (string | null | undefined)[],
): Promise<Map<string, ClerkUserSummary>> => {
  const ids = dedupe(rawIds);
  const result = new Map<string, ClerkUserSummary>();
  if (ids.length === 0) return result;

  const client = await clerkClient();

  const [byId, byExternal] = await Promise.all([
    client.users.getUserList({ userId: ids, limit: LIMIT }),
    client.users.getUserList({ externalId: ids, limit: LIMIT }),
  ]);

  for (const user of byId.data) {
    result.set(user.id, toClerkUserSummary(user));
  }
  for (const user of byExternal.data) {
    if (user.externalId && !result.has(user.externalId)) {
      result.set(user.externalId, toClerkUserSummary(user));
    }
  }

  return result;
};
