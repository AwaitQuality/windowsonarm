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

export const statusVoteSchema = z.object({
  status_id: z.number().int(),
});

export type StatusVoteInput = z.infer<typeof statusVoteSchema>;
