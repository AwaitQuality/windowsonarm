import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import ErrorResponse from "@/lib/backend/response/ErrorResponse";
import DataResponse from "@/lib/backend/response/DataResponse";
import getPrisma from "@/lib/db/prisma";
import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = "edge";

// Add interface for request body
interface VoteStatusRequest {
  status_id: number;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return ErrorResponse.json("Unauthorized", { status: 401 });
    }

    const body = await request.json() as VoteStatusRequest;
    const { status_id } = body;

    // Validate status_id
    if (typeof status_id !== 'number') {
      return ErrorResponse.json("Invalid status_id", { status: 400 });
    }

    const { env } = getRequestContext();
    const prisma = getPrisma(env.DB);

    // Check if post exists and has status -1
    const post = await prisma.post.findUnique({
      where: { id: params.id },
      select: { status_id: true },
    });

    if (!post || post.status_id !== -1) {
      return ErrorResponse.json("Invalid post or post status", { status: 400 });
    }

    // Upsert the vote
    await prisma.statusVote.upsert({
      where: {
        post_id_user_id: {
          post_id: params.id,
          user_id: userId,
        },
      },
      create: {
        post_id: params.id,
        user_id: userId,
        status_id,
      },
      update: {
        status_id,
      },
    });

    return DataResponse.json({ success: true });
  } catch (error: any) {
    return ErrorResponse.json(error.message);
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    const { env } = getRequestContext();
    const prisma = getPrisma(env.DB);

    // Get vote counts
    const votes = await prisma.statusVote.groupBy({
      by: ['status_id'],
      where: { post_id: params.id },
      _count: true,
    });

    // Get user's vote if logged in
    let userVote = null;
    if (userId) {
      const vote = await prisma.statusVote.findUnique({
        where: {
          post_id_user_id: {
            post_id: params.id,
            user_id: userId,
          },
        },
      });
      userVote = vote?.status_id;
    }

    return DataResponse.json({
      votes: votes.map(v => ({
        status_id: v.status_id,
        count: v._count,
      })),
      userVote,
    });
  } catch (error: any) {
    return ErrorResponse.json(error.message);
  }
} 