import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import ErrorResponse from "@/lib/backend/response/ErrorResponse";
import DataResponse from "@/lib/backend/response/DataResponse";
import getPrisma from "@/lib/db/prisma";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { z } from "zod";
import type { Review as PrismaReview } from "@/lib/generated/prisma/client";
import type { Review } from "@/lib/types/review";
import { PENDING_STATUS_ID } from "@/lib/schemas/post";
import { handleRouteError } from "@/lib/backend/errors";
import { isAdminUser } from "@/lib/backend/auth";
import { lookupClerkUsersByIds } from "@/lib/backend/clerk";


const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
});

/**
 * The wire `Review` as it looks before serialisation: same fields, but the
 * timestamps are still `Date` objects on this side of `DataResponse`.
 */
type ReviewPayload = Omit<Review, "created_at" | "updated_at"> &
  Pick<PrismaReview, "created_at" | "updated_at">;

export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const { userId } = await auth();
    if (!userId) {
      return ErrorResponse.json("Authentication required", { status: 401 });
    }

    const body = await request.json();
    const validatedData = reviewSchema.parse(body);

    const { env } = await getCloudflareContext({ async: true });
    const prisma = getPrisma(env.DB);

    // Confirm the post is reviewable up front, otherwise a bad id surfaces as a
    // raw foreign-key violation. Pending posts are not public, so nor are their
    // reviews.
    const post = await prisma.post.findUnique({
      where: { id: params.id },
      select: { effective_status_id: true },
    });

    if (!post || post.effective_status_id === PENDING_STATUS_ID) {
      return ErrorResponse.json("Post not found", { status: 404 });
    }

    // Check if user already reviewed this post
    const existingReview = await prisma.review.findFirst({
      where: {
        post_id: params.id,
        user_id: userId,
      },
    });

    if (existingReview) {
      // Update existing review
      const updatedReview = await prisma.review.update({
        where: { id: existingReview.id },
        data: {
          rating: validatedData.rating,
          comment: validatedData.comment,
          updated_at: new Date(),
        },
      });

      return DataResponse.json(updatedReview);
    }

    // Create new review
    const review = await prisma.review.create({
      data: {
        post_id: params.id,
        user_id: userId,
        rating: validatedData.rating,
        comment: validatedData.comment,
      },
    });

    return DataResponse.json(review, { status: 201 });
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}

export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const { env } = await getCloudflareContext({ async: true });
    const prisma = getPrisma(env.DB);

    const reviews = await prisma.review.findMany({
      where: { post_id: params.id },
      orderBy: { created_at: 'desc' },
    });

    // Resolve authors through the shared Clerk lookup, which dedupes the ids,
    // skips the call when there are none, and handles legacy externalId refs.
    const userMap = await lookupClerkUsersByIds(
      reviews.map((review) => review.user_id)
    );

    // Add user information to reviews
    const reviewsWithUsers: ReviewPayload[] = reviews.map(review => {
      return {
        ...review,
        user: userMap.get(review.user_id),
      };
    });

    return DataResponse.json(reviewsWithUsers);
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}

// Add DELETE method to handle review removal
export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const { userId } = await auth();
    if (!userId) {
      return ErrorResponse.json("Authentication required", { status: 401 });
    }

    const searchParams = new URL(request.url).searchParams;
    const reviewId = searchParams.get('reviewId');

    if (!reviewId) {
      return ErrorResponse.json("Review ID is required", { status: 400 });
    }

    const { env } = await getCloudflareContext({ async: true });
    const prisma = getPrisma(env.DB);

    // Scope the lookup to this post so a review cannot be deleted through an
    // unrelated post's URL.
    const review = await prisma.review.findFirst({
      where: { id: reviewId, post_id: params.id },
      select: { id: true, user_id: true },
    });

    if (!review) {
      return ErrorResponse.json("Review not found", { status: 404 });
    }

    // Authors may remove their own review; admins may remove any.
    if (review.user_id !== userId && !(await isAdminUser(userId))) {
      return ErrorResponse.json("You cannot delete this review", {
        status: 403,
      });
    }

    await prisma.review.delete({
      where: { id: review.id },
    });

    return DataResponse.json({ success: true });
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}
