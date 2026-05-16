import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import getPrisma from "@/lib/db/prisma";
import DataResponse from "@/lib/backend/response/DataResponse";
import ErrorResponse from "@/lib/backend/response/ErrorResponse";
import { statusVoteSchema } from "@/lib/schemas/post";
import {
  recomputeEffectiveStatus,
  tallyVotes,
  submitterHasImplicitVote,
} from "@/lib/backend/voting";

export const runtime = "edge";

export interface VoteSummary {
  tallies: { status_id: number; count: number }[];
  userVoteStatusId: number | null;
  submitterImplicitVote: boolean;
  effective_status_id: number | null;
  community_voted: boolean;
}

const buildSummary = async (
  prisma: ReturnType<typeof getPrisma>,
  postId: string,
  userId: string | null,
): Promise<VoteSummary | null> => {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      user_id: true,
      status_hint: true,
      effective_status_id: true,
      community_voted: true,
      status_votes: { select: { user_id: true, status_id: true } },
    },
  });

  if (!post) return null;

  return {
    tallies: tallyVotes(post.status_votes, post.user_id, post.status_hint),
    userVoteStatusId:
      post.status_votes.find((v) => v.user_id === userId)?.status_id ?? null,
    submitterImplicitVote: submitterHasImplicitVote(post, post.status_votes),
    effective_status_id: post.effective_status_id,
    community_voted: post.community_voted,
  };
};

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { userId } = auth();
    const { env } = getRequestContext();
    const prisma = getPrisma(env.DB);

    const summary = await buildSummary(prisma, params.id, userId);
    if (!summary) return ErrorResponse.json("Post not found", { status: 404 });

    return DataResponse.json(summary);
  } catch (error: any) {
    return ErrorResponse.json(error.message);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { userId } = auth();
    if (!userId) return ErrorResponse.json("Sign in to vote", { status: 401 });

    const body = statusVoteSchema.parse(await request.json());

    const { env } = getRequestContext();
    const prisma = getPrisma(env.DB);

    const post = await prisma.post.findUnique({
      where: { id: params.id },
      select: { id: true, user_id: true, status_hint: true },
    });
    if (!post) return ErrorResponse.json("Post not found", { status: 404 });

    // Submitter who provided a status_hint can't override their own vote.
    if (post.user_id === userId && post.status_hint != null) {
      return ErrorResponse.json(
        "Your initial status hint already counts as your vote",
        { status: 403 },
      );
    }

    const status = await prisma.status.findUnique({
      where: { id: body.status_id },
    });
    if (!status) return ErrorResponse.json("Unknown status", { status: 400 });

    await prisma.statusVote.upsert({
      where: { user_id_post_id: { user_id: userId, post_id: params.id } },
      update: { status_id: body.status_id, updated_at: new Date() },
      create: {
        user_id: userId,
        post_id: params.id,
        status_id: body.status_id,
      },
    });

    await recomputeEffectiveStatus(prisma, params.id);

    const summary = await buildSummary(prisma, params.id, userId);
    return DataResponse.json(summary);
  } catch (error: any) {
    return ErrorResponse.json(error.message);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { userId } = auth();
    if (!userId) return ErrorResponse.json("Sign in to vote", { status: 401 });

    const { env } = getRequestContext();
    const prisma = getPrisma(env.DB);

    await prisma.statusVote
      .delete({
        where: { user_id_post_id: { user_id: userId, post_id: params.id } },
      })
      .catch(() => null);

    await recomputeEffectiveStatus(prisma, params.id);

    const summary = await buildSummary(prisma, params.id, userId);
    return DataResponse.json(summary);
  } catch (error: any) {
    return ErrorResponse.json(error.message);
  }
}
