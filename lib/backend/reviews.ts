import getPrisma from "@/lib/db/prisma";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { lookupClerkUsersByIds } from "@/lib/backend/clerk";
import type { Review } from "@/lib/types/review";

/**
 * Reviews for one post, newest first, with authors resolved.
 *
 * Dates are serialized to ISO strings here rather than left as `Date`: that is
 * what actually crosses the wire from the API route, and it is what
 * `lib/types/review.ts` declares. Returning the same shape from both the route
 * and the server prefetch keeps the client from seeing two different types for
 * the same data.
 */
export const listReviews = async (postId: string): Promise<Review[]> => {
  const { env } = await getCloudflareContext({ async: true });
  const prisma = getPrisma(env.DB);

  const reviews = await prisma.review.findMany({
    where: { post_id: postId },
    orderBy: { created_at: "desc" },
  });

  // Shared Clerk lookup: dedupes the ids, skips the call when there are none,
  // and handles legacy externalId references.
  const userMap = await lookupClerkUsersByIds(
    reviews.map((review) => review.user_id)
  );

  return reviews.map((review) => ({
    ...review,
    created_at: review.created_at.toISOString(),
    updated_at: review.updated_at.toISOString(),
    user: userMap.get(review.user_id),
  }));
};
