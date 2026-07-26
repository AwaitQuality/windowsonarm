import { clerkClient } from "@clerk/nextjs/server";
import type { User } from "@clerk/nextjs/server";

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
): Promise<Map<string, User>> => {
  const ids = dedupe(rawIds);
  const result = new Map<string, User>();
  if (ids.length === 0) return result;

  const client = await clerkClient();

  const [byId, byExternal] = await Promise.all([
    client.users.getUserList({ userId: ids, limit: LIMIT }),
    client.users.getUserList({ externalId: ids, limit: LIMIT }),
  ]);

  for (const user of byId.data) {
    result.set(user.id, user);
  }
  for (const user of byExternal.data) {
    if (user.externalId && !result.has(user.externalId)) {
      result.set(user.externalId, user);
    }
  }

  return result;
};
