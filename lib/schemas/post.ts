import { z } from "zod";

const optionalUrl = z.string().url().optional().or(z.literal(""));

export const createPostSchema = z.object({
  title: z.string().min(1).max(255),
  company: z.string().min(1).max(255),
  description: z.string().min(50),
  tags: z.array(z.string()).max(10).optional(),
  app_url: optionalUrl,
  banner_url: z.string().optional().or(z.literal("")),
  status_hint: z.string().optional(),
  icon_url: z.string().optional().or(z.literal("")),
  categoryId: z.string().min(1),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;

export const updatePostSchema = z.object({
  title: z.string().min(1).max(255),
  company: z.string().min(1).max(255),
  description: z.string(),
  tags: z.array(z.string()).max(10).optional(),
  app_url: optionalUrl.nullable(),
  banner_url: z.string().optional().or(z.literal("")).nullable(),
  icon_url: z.string().optional().or(z.literal("")).nullable(),
  status_id: z.coerce.number(),
  categoryId: z.string().min(1),
});

export type UpdatePostInput = z.infer<typeof updatePostSchema>;

export const statusVoteSchema = z.object({
  status_id: z.number().int(),
});

export type StatusVoteInput = z.infer<typeof statusVoteSchema>;

export const PENDING_STATUS_ID = -1;
export const COMMUNITY_VOTE_THRESHOLD = 2;
