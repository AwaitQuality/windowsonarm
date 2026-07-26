import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import ErrorResponse from "@/lib/backend/response/ErrorResponse";
import DataResponse from "@/lib/backend/response/DataResponse";
import getPrisma from "@/lib/db/prisma";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import {
  recomputeEffectiveStatus,
  submitterHasImplicitVote,
  tallyVotes,
} from "@/lib/backend/voting";
import { statusVoteSchema } from "@/lib/schemas/post";
import { handleRouteError } from "@/lib/backend/errors";


export interface VoteStatusResponse {
  votes: { status_id: number; count: number }[];
  userVote: number | null;
  /** True when the submitter's status_hint is still standing in as their vote. */
  submitterImplicitVote: boolean;
  effective_status_id: number | null;
  community_voted: boolean;
}

const buildSummary = async (
  prisma: ReturnType<typeof getPrisma>,
  postId: string,
  userId: string | null
): Promise<VoteStatusResponse | null> => {
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
    votes: tallyVotes(post.status_votes, post.user_id, post.status_hint),
    userVote:
      post.status_votes.find((v) => v.user_id === userId)?.status_id ?? null,
    submitterImplicitVote: submitterHasImplicitVote(post, post.status_votes),
    effective_status_id: post.effective_status_id,
    community_voted: post.community_voted,
  };
};

export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const { userId } = await auth();
    if (!userId) {
      return ErrorResponse.json("Authentication required", { status: 401 });
    }

    const { status_id } = statusVoteSchema.parse(await request.json());

    const { env } = await getCloudflareContext({ async: true });
    const prisma = getPrisma(env.DB);

    const post = await prisma.post.findUnique({
      where: { id: params.id },
      select: { user_id: true, status_hint: true },
    });

    if (!post) {
      return ErrorResponse.json("Post not found", { status: 404 });
    }

    // The submitter's status_hint already counts as their vote.
    if (post.user_id === userId && post.status_hint != null) {
      return ErrorResponse.json(
        "Your initial status hint already counts as your vote",
        { status: 403 }
      );
    }

    const status = await prisma.status.findUnique({ where: { id: status_id } });
    if (!status) {
      return ErrorResponse.json("Unknown status", { status: 400 });
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

    await recomputeEffectiveStatus(prisma, params.id);

    return DataResponse.json(await buildSummary(prisma, params.id, userId));
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}

export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const { userId } = await auth();
    const { env } = await getCloudflareContext({ async: true });
    const prisma = getPrisma(env.DB);

    const summary = await buildSummary(prisma, params.id, userId);
    if (!summary) {
      return ErrorResponse.json("Post not found", { status: 404 });
    }

    return DataResponse.json(summary);
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const { userId } = await auth();
    if (!userId) {
      return ErrorResponse.json("Authentication required", { status: 401 });
    }

    const { env } = await getCloudflareContext({ async: true });
    const prisma = getPrisma(env.DB);

    await prisma.statusVote
      .delete({
        where: {
          post_id_user_id: {
            post_id: params.id,
            user_id: userId,
          },
        },
      })
      .catch(() => null);

    await recomputeEffectiveStatus(prisma, params.id);

    const summary = await buildSummary(prisma, params.id, userId);
    if (!summary) {
      return ErrorResponse.json("Post not found", { status: 404 });
    }

    return DataResponse.json(summary);
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}
