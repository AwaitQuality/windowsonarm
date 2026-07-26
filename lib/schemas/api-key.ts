import { z } from "zod";

/**
 * Leaf scopes. Each one names exactly one capability, and every admin route
 * declares the leaf it needs — never a wildcard, so widening a key is always a
 * deliberate act by the person creating it.
 */
export const LEAF_SCOPES = [
  "posts:read",
  "posts:write",
  "posts:delete",
  "blog:read",
  "blog:write",
  "blog:delete",
  "reviews:read",
  "reviews:delete",
  "taxonomy:read",
  "taxonomy:write",
  "keys:read",
  "keys:write",
] as const;

/**
 * Grantable-only shorthands. `<resource>:*` covers every leaf of that resource
 * and `admin:*` covers everything, including resources added later — which is
 * precisely why it should be the exception rather than the default.
 */
export const WILDCARD_SCOPES = [
  "posts:*",
  "blog:*",
  "reviews:*",
  "taxonomy:*",
  "keys:*",
  "admin:*",
] as const;

export const API_SCOPES = [...LEAF_SCOPES, ...WILDCARD_SCOPES] as const;

export type LeafScope = (typeof LEAF_SCOPES)[number];
export type ApiScope = (typeof API_SCOPES)[number];

export const apiScopeSchema = z.enum(API_SCOPES);

/**
 * Does a granted set cover `required`?
 *
 * Deliberately not a prefix/`startsWith` match: `posts:read` must not be
 * satisfied by a granted `posts:read-only`-style neighbour, and a required
 * *wildcard* is only ever covered by an identical wildcard or by `admin:*` —
 * holding `posts:read` must never add up to holding `posts:*`.
 */
export const grantSatisfies = (
  granted: readonly ApiScope[],
  required: ApiScope
): boolean => {
  if (granted.includes("admin:*")) return true;
  if (granted.includes(required)) return true;
  if (required.endsWith(":*")) return false;

  const resource = required.slice(0, required.indexOf(":"));
  return granted.includes(`${resource}:*` as ApiScope);
};

/** Does a key's granted set satisfy the scope a route requires? */
export const scopeSatisfies = (
  granted: readonly ApiScope[],
  required: LeafScope
): boolean => grantSatisfies(granted, required);

/**
 * May a caller holding `granted` mint a key holding `requested`?
 *
 * Without this, any key carrying `keys:write` could mint itself an `admin:*`
 * successor, and every scope restriction would be one API call from being
 * undone. A key can only ever hand out authority it already has.
 */
export const canGrantScopes = (
  granted: readonly ApiScope[],
  requested: readonly ApiScope[]
): boolean => requested.every((scope) => grantSatisfies(granted, scope));

/** Expands wildcards to the leaves they cover, for display in the UI. */
export const expandScopes = (granted: readonly ApiScope[]): LeafScope[] =>
  LEAF_SCOPES.filter((leaf) => scopeSatisfies(granted, leaf));

/** Human-readable copy for the key-management UI and the API docs. */
export const SCOPE_DESCRIPTIONS: Record<ApiScope, string> = {
  "posts:read": "Read every app, including the pending review queue",
  "posts:write": "Create and edit apps, and set their status",
  "posts:delete": "Delete apps",
  "blog:read": "Read blog posts, including unpublished drafts",
  "blog:write": "Create and edit blog posts",
  "blog:delete": "Delete blog posts",
  "reviews:read": "Read every review",
  "reviews:delete": "Delete any user's review",
  "taxonomy:read": "Read categories, statuses and tags",
  "taxonomy:write": "Create, edit and delete categories, statuses and tags",
  "keys:read": "List your own API keys",
  "keys:write": "Create, edit and revoke your own API keys",
  "posts:*": "Full access to apps",
  "blog:*": "Full access to the blog",
  "reviews:*": "Full access to reviews",
  "taxonomy:*": "Full access to categories, statuses and tags",
  "keys:*": "Full access to your own API keys",
  "admin:*": "Everything, including capabilities added in future",
};

/**
 * Scopes are persisted as a JSON string. Anything unrecognised is dropped
 * rather than trusted: an unknown value in that column must never widen a key.
 */
export const parseStoredScopes = (raw: string): ApiScope[] => {
  let decoded: unknown;

  try {
    decoded = JSON.parse(raw);
  } catch {
    return [];
  }

  if (!Array.isArray(decoded)) return [];

  return decoded.filter((value): value is ApiScope =>
    API_SCOPES.includes(value as ApiScope)
  );
};

const scopeListSchema = z
  .array(apiScopeSchema)
  .min(1, "Select at least one scope")
  .max(API_SCOPES.length)
  // A key granting the same scope twice is the same key; normalising here keeps
  // the stored JSON canonical.
  .transform((scopes) => Array.from(new Set(scopes)));

export const createApiKeySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  scopes: scopeListSchema,
  /**
   * ISO timestamp. Absent means the key does not expire — allowed, but the UI
   * nudges towards a date.
   */
  expires_at: z
    .string()
    .datetime({ message: "Expiry must be an ISO-8601 timestamp" })
    .optional()
    .nullable(),
});

export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;

/** Everything about a key that can still be changed once it exists. */
export const updateApiKeySchema = z
  .object({
    name: z.string().trim().min(1).max(80).optional(),
    scopes: scopeListSchema.optional(),
    expires_at: z.string().datetime().nullable().optional(),
  })
  .refine(
    (value) => Object.keys(value).length > 0,
    "Provide at least one field to update"
  );

export type UpdateApiKeyInput = z.infer<typeof updateApiKeySchema>;

/** The safe projection of a key — never includes the hash or the token. */
export interface ApiKeySummary {
  id: string;
  name: string;
  prefix: string;
  scopes: ApiScope[];
  last_used_at: string | null;
  expires_at: string | null;
  revoked_at: string | null;
  created_at: string;
}

/**
 * The creation response. `token` appears here and nowhere else, ever — there is
 * no endpoint that can return it a second time.
 */
export interface CreatedApiKey extends ApiKeySummary {
  token: string;
}
