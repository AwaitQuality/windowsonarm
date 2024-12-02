import { z } from "zod";

export const blogPostSchema = z.object({
  title: z.string().min(1).max(255),
  content: z.string().min(50),
  description: z.string().min(10).max(200).optional(),
  image_url: z.string().url().optional().or(z.literal("")),
  published: z.boolean().default(true),
  created_at: z.string().optional(),
});

export type BlogPostSchema = z.infer<typeof blogPostSchema>;

export interface UpdateBlogPostRequest extends BlogPostSchema {
  id: string;
} 