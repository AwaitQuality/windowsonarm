import { z } from "zod";

/**
 * Schemas for the reference data behind every post: statuses, categories and
 * tags. These are only writable through the admin API — the public surface
 * reads them via /api/v1/info.
 */

const name = z.string().trim().min(1, "Name is required").max(60);
const index = z.number().int().min(0).max(9999);

/** Hex colour, with the leading `#`. Statuses are rendered straight from this. */
const color = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, "Colour must be a hex value like #2563eb");

export const createStatusSchema = z.object({
  name,
  color,
  /** Short label shown next to the badge. */
  text: z.string().trim().min(1).max(120),
  /** Fluent UI icon name, resolved at render time. */
  icon: z.string().trim().min(1).max(80),
  index: index.optional(),
});

export const updateStatusSchema = createStatusSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "Provide at least one field to update"
);

export type CreateStatusInput = z.infer<typeof createStatusSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;

export const createCategorySchema = z.object({
  name,
  icon: z.string().trim().min(1).max(80),
  index: index.optional(),
});

export const updateCategorySchema = createCategorySchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "Provide at least one field to update"
);

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

export const createTagSchema = z.object({
  name,
  index: index.optional(),
});

export const updateTagSchema = createTagSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "Provide at least one field to update"
);

export type CreateTagInput = z.infer<typeof createTagSchema>;
export type UpdateTagInput = z.infer<typeof updateTagSchema>;
