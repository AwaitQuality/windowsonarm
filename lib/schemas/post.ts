import { z } from "zod";

/** Status id used for posts that have not been reviewed by an admin yet. */
export const PENDING_STATUS_ID = -1;

/** Number of votes a single status needs before the community decides it. */
export const COMMUNITY_VOTE_THRESHOLD = 2;

const optionalUrl = z
  .string()
  .url({ message: "Please enter a valid URL" })
  .optional()
  .or(z.literal(""));

const optionalText = z.string().optional().or(z.literal(""));

export const createPostSchema = z.object({
  title: z.string().max(255),
  company: z.string().max(255),
  description: z.string().min(50),
  tags: z.array(z.string()).max(10).optional(),
  app_url: optionalUrl,
  community_url: optionalUrl,
  banner_url: optionalUrl,
  status_hint: z.string(),
  icon_url: optionalText,
  categoryId: z.string(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;

export const updatePostSchema = z.object({
  title: z.string().max(255),
  company: z.string().max(255),
  description: z.string(),
  tags: z.array(z.string()).max(15).optional(),
  app_url: optionalUrl.nullable(),
  community_url: optionalText.nullable(),
  banner_url: optionalText.nullable(),
  icon_url: optionalText.nullable(),
  status_id: z.coerce.number(),
  categoryId: z.string(),
});

export type UpdatePostInput = z.infer<typeof updatePostSchema>;

/**
 * Admin-authored creation, for POST /api/v1/admin/posts.
 *
 * Differs from `createPostSchema` in three ways, all of them because the author
 * is trusted: the status is set directly instead of being forced to PENDING,
 * `status_hint` arrives as a number rather than a form string, and the post can
 * be attributed to another user (for imports and backfills).
 */
export const adminCreatePostSchema = z.object({
  title: z.string().min(1).max(255),
  company: z.string().min(1).max(255),
  description: z.string().min(1),
  tags: z.array(z.string()).max(15).optional(),
  app_url: optionalUrl,
  community_url: optionalUrl,
  banner_url: optionalUrl,
  icon_url: optionalText,
  status_id: z.coerce.number().int(),
  status_hint: z.coerce.number().int().nullable().optional(),
  categoryId: z.string().min(1),
  /** Attribution override. Defaults to the acting admin. */
  user_id: z.string().min(1).nullable().optional(),
});

export type AdminCreatePostInput = z.infer<typeof adminCreatePostSchema>;

/**
 * Partial update, for PATCH /api/v1/admin/posts/{id}. The existing PUT is a
 * full replace, which forces a script that only wants to move a status to
 * re-send the entire post — and to race anyone editing it in the meantime.
 *
 * `user_id` is deliberately not re-exposed here: re-attributing an existing post
 * would silently move its submitter's implicit status vote to someone else.
 */
export const adminUpdatePostSchema = adminCreatePostSchema
  .omit({ user_id: true })
  .partial()
  .extend({ update_description: optionalText.nullable().optional() })
  .refine(
    (value) => Object.keys(value).length > 0,
    "Provide at least one field to update"
  );

export type AdminUpdatePostInput = z.infer<typeof adminUpdatePostSchema>;

export const statusVoteSchema = z.object({
  status_id: z.number().int(),
});

export type StatusVoteInput = z.infer<typeof statusVoteSchema>;
