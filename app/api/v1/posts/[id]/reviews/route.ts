import { NextRequest } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import ErrorResponse from "@/lib/backend/response/ErrorResponse";
import DataResponse from "@/lib/backend/response/DataResponse";
import getPrisma from "@/lib/db/prisma";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { z } from "zod";
import { User } from "@clerk/nextjs/server";


const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().max(2000).optional(),
});

interface Review {
  id: string;
  post_id: string;
  user_id: string;
  rating: number;
  comment?: string | null;
  created_at: Date;
  updated_at: Date;
  user?: {
    username?: string;
    imageUrl?: string;
  };
}

export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const { userId } = await auth();
    if (!userId) {
      return ErrorResponse.json("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const validatedData = reviewSchema.parse(body);

    const { env } = await getCloudflareContext({ async: true });
    const prisma = getPrisma(env.DB);

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

    return DataResponse.json(review);
  } catch (error: any) {
    return ErrorResponse.json(error.message);
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
    
    // Get unique user IDs
    const userIds = [...new Set(reviews.map(review => review.user_id))];

    // Fetch user information from Clerk
    const usersResponse = await (await clerkClient()).users.getUserList({
      userId: userIds,
    });
    const users = usersResponse.data;

    // Add user information to reviews
    const reviewsWithUsers = reviews.map(review => {
      const user = users.find((u: User) => u.id === review.user_id);
      return {
        ...review,
        user: user ? {
          username: user.username || `${user.firstName} ${user.lastName}`.trim(),
          imageUrl: user.imageUrl,
        } : undefined,
      };
    });

    return DataResponse.json(reviewsWithUsers);
  } catch (error: any) {
    return ErrorResponse.json(error.message);
  }
}

// Add DELETE method to handle review removal
export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    await props.params;
    const { userId } = await auth();
    if (!userId) {
      return ErrorResponse.json("Unauthorized", { status: 401 });
    }

    const searchParams = new URL(request.url).searchParams;
    const reviewId = searchParams.get('reviewId');
    
    if (!reviewId) {
      return ErrorResponse.json("Review ID is required", { status: 400 });
    }

    const { env } = await getCloudflareContext({ async: true });
    const prisma = getPrisma(env.DB);

    // Check if user is admin
    const user = await (await clerkClient()).users.getUser(userId);
    const isAdmin = user.publicMetadata?.role === 'admin';

    if (!isAdmin) {
      return ErrorResponse.json("Unauthorized", { status: 401 });
    }

    // Delete the review
    await prisma.review.delete({
      where: { id: reviewId },
    });

    return DataResponse.json({ success: true });
  } catch (error: any) {
    return ErrorResponse.json(error.message);
  }
} 