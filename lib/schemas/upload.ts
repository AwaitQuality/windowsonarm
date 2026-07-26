import { z } from "zod";

/**
 * Shared upload contract. Lives here rather than in the route module because the
 * client imports these values at runtime — importing them from
 * app/api/v1/upload/route.ts would drag Clerk's server-only auth into the client
 * bundle.
 */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Only image types we are willing to serve back from R2_PUBLIC_URL. Anything
 * renderable (text/html, image/svg+xml, application/javascript) would be stored
 * XSS on the public bucket domain, so the allowlist stays narrow.
 */
export const ALLOWED_CONTENT_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

export type AllowedContentType = (typeof ALLOWED_CONTENT_TYPES)[number];

export const EXTENSION_BY_CONTENT_TYPE: Record<AllowedContentType, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

export const uploadRequestSchema = z.object({
  contentType: z.enum(ALLOWED_CONTENT_TYPES),
  size: z.number().int().positive().max(MAX_UPLOAD_BYTES),
});

export type FileUploadRequest = z.infer<typeof uploadRequestSchema>;

export interface FileUploadResponse {
  url: string;
  fields: Record<string, string>;
  downloadUrl: string;
}
