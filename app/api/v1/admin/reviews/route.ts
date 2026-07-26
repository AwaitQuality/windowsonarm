import { NextRequest } from "next/server";
import { z } from "zod";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import DataResponse from "@/lib/backend/response/DataResponse";
import getPrisma from "@/lib/db/prisma";
import { handleRouteError } from "@/lib/backend/errors";
import { requireAdmin } from "@/lib/backend/auth";
import { lookupClerkUsersByIds } from "@/lib/backend/clerk";
import type { ClerkUserSummary } from "@/lib/types/clerk";

const PAGE_SIZE = 50;

export interface AdminReviewSummary {
  id: string;
  post_id: string;
  post_title: string;
  user_id: string;
  user: ClerkUserSummary | null;
  rating: number;
  comment: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface AdminReviewsResponse {
  reviews: AdminReviewSummary[];
  nextCursor: string | null;
}

const listQuerySchema = z.object({
  cursor: z.string().trim().min(1).optional(),
  post_id: z.string().trim().min(1).optional(),
  user_id: z.string().trim().min(1).optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
});

/**
 * Cross-post review moderation. The public route only lists reviews one post at
 * a time, which makes finding a spamming account impossible without walking
 * every app.
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request, "reviews:read");

    if (!admin.ok) {
      return admin.response;
    }

    const raw = (key: string): string | undefined =>
      request.nextUrl.searchParams.get(key) || undefined;

    const query = listQuerySchema.parse({
      cursor: raw("cursor"),
      post_id: raw("post_id"),
      user_id: raw("user_id"),
      rating: raw("rating"),
    });

    const { env } = await getCloudflareContext({ async: true });
    const prisma = getPrisma(env.DB);

    const reviews = await prisma.review.findMany({
      take: PAGE_SIZE,
      cursor: query.cursor ? { id: query.cursor } : undefined,
      skip: query.cursor ? 1 : 0,
      where: {
        post_id: query.post_id,
        user_id: query.user_id,
        rating: query.rating,
      },
      include: { post: { select: { title: true } } },
      orderBy: [{ created_at: "desc" }, { id: "asc" }],
    });

    const userMap = await lookupClerkUsersByIds(
      reviews.map((review) => review.user_id)
    );

    const summaries: AdminReviewSummary[] = reviews.map((review) => ({
      id: review.id,
      post_id: review.post_id,
      post_title: review.post.title,
      user_id: review.user_id,
      user: userMap.get(review.user_id) ?? null,
      rating: review.rating,
      comment: review.comment,
      created_at: review.created_at,
      updated_at: review.updated_at,
    }));

    const response: AdminReviewsResponse = {
      reviews: summaries,
      nextCursor:
        reviews.length === PAGE_SIZE
          ? (reviews[reviews.length - 1]?.id ?? null)
          : null,
    };

    return DataResponse.json(response);
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}
