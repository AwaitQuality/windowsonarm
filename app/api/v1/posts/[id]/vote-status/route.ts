import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import ErrorResponse from "@/lib/backend/response/ErrorResponse";
import DataResponse from "@/lib/backend/response/DataResponse";
import getPrisma from "@/lib/db/prisma";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import {
  getVoteSummary,
  recomputeEffectiveStatus,
} from "@/lib/backend/voting";
import { statusVoteSchema } from "@/lib/schemas/post";
import { handleRouteError } from "@/lib/backend/errors";


export type { VoteStatusResponse } from "@/lib/backend/voting";

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

    return DataResponse.json(await getVoteSummary(params.id, userId, prisma));
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

    const summary = await getVoteSummary(params.id, userId, prisma);
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

    const summary = await getVoteSummary(params.id, userId, prisma);
    if (!summary) {
      return ErrorResponse.json("Post not found", { status: 404 });
    }

    return DataResponse.json(summary);
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}
