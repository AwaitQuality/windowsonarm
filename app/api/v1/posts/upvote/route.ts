import { NextRequest } from "next/server";
import ErrorResponse from "@/lib/backend/response/ErrorResponse";
import DataResponse from "@/lib/backend/response/DataResponse";
import getPrisma from "@/lib/db/prisma";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { auth } from "@clerk/nextjs/server";


export interface UpvoteRequest {
  postId: string;
}

export async function POST(request: NextRequest) {
  try {
    const { postId } = (await request.json()) as UpvoteRequest;

    // get user via next auth
    const { userId } = await auth();

    if (!userId) {
      return ErrorResponse.json("User not found");
    }

    const { env } = await getCloudflareContext({ async: true });

    const prisma = getPrisma(env.DB);

    const post = await prisma.post.findUnique({
      where: {
        id: postId,
      },
    });

    if (!post) {
      return ErrorResponse.json("Post not found");
    }

    // If the user has already upvoted the post, undo the upvote
    const existingUpvote = await prisma.upvote.findFirst({
      where: {
        post_id: postId,
        user_id: userId,
      },
    });

    if (existingUpvote) {
      await prisma.upvote.delete({
        where: {
          id: existingUpvote.id,
        },
      });

      await prisma.post.update({
        where: { id: postId },
        data: { upvotes_count: { decrement: 1 } },
      });

      return DataResponse.json({
        action: "unvoted",
        post,
      });
    }

    await prisma.upvote.create({
      data: {
        post_id: postId,
        user_id: userId,
      },
    });

    await prisma.post.update({
      where: { id: postId },
      data: { upvotes_count: { increment: 1 } },
    });

    return DataResponse.json(post);
  } catch (error: any) {
    return ErrorResponse.json(error.message);
  }
}
