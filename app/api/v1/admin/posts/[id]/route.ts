import { NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import DataResponse from "@/lib/backend/response/DataResponse";
import ErrorResponse from "@/lib/backend/response/ErrorResponse";
import getPrisma from "@/lib/db/prisma";
import { handleRouteError } from "@/lib/backend/errors";
import { requireAdmin } from "@/lib/backend/auth";
import { lookupClerkUsersByIds } from "@/lib/backend/clerk";
import { adminUpdatePostSchema } from "@/lib/schemas/post";
import { recomputeEffectiveStatus, tallyVotes } from "@/lib/backend/voting";

/**
 * Full detail for one post, whatever its status — including the vote tally,
 * which is what an admin actually needs when working the review queue and which
 * the public route does not return.
 */
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const admin = await requireAdmin(request, "posts:read");

    if (!admin.ok) {
      return admin.response;
    }

    const { env } = await getCloudflareContext({ async: true });
    const prisma = getPrisma(env.DB);

    const post = await prisma.post.findUnique({
      where: { id: params.id },
      include: {
        category: true,
        status: true,
        effective_status: true,
        tags: true,
        status_votes: { select: { user_id: true, status_id: true } },
        _count: { select: { reviews: true, upvotes: true, views: true } },
      },
    });

    if (!post) {
      return ErrorResponse.json("Post not found", { status: 404 });
    }

    const userMap = await lookupClerkUsersByIds([post.user_id]);

    return DataResponse.json({
      ...post,
      user: post.user_id ? (userMap.get(post.user_id) ?? null) : null,
      vote_tally: tallyVotes(post.status_votes, post.user_id, post.status_hint),
    });
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}

/**
 * Partial update. The full-replace PUT lives on /api/v1/posts/{id}; this exists
 * so a script can move a single field (most often the status) without having to
 * round-trip and re-send everything else.
 */
export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const admin = await requireAdmin(request, "posts:write");

    if (!admin.ok) {
      return admin.response;
    }

    const input = adminUpdatePostSchema.parse(await request.json());

    const { env } = await getCloudflareContext({ async: true });
    const prisma = getPrisma(env.DB);

    const existing = await prisma.post.findUnique({
      where: { id: params.id },
      select: { id: true, status_id: true },
    });

    if (!existing) {
      return ErrorResponse.json("Post not found", { status: 404 });
    }

    if (input.status_id !== undefined) {
      const status = await prisma.status.findUnique({
        where: { id: input.status_id },
      });
      if (!status) {
        return ErrorResponse.json("Unknown status_id", { status: 400 });
      }
    }

    if (input.categoryId !== undefined) {
      const category = await prisma.category.findUnique({
        where: { id: input.categoryId },
      });
      if (!category) {
        return ErrorResponse.json("Unknown categoryId", { status: 400 });
      }
    }

    const { tags, ...scalars } = input;

    await prisma.post.update({
      where: { id: params.id },
      data: {
        ...scalars,
        // `set: []` first, so an explicit tag list replaces rather than adds.
        // Omitting `tags` entirely leaves the existing ones untouched, which is
        // what a partial update should do.
        tags: tags
          ? {
              set: [],
              connectOrCreate: tags.map((tag) => ({
                where: { name: tag },
                create: { name: tag },
              })),
            }
          : undefined,
        updated_at: new Date(),
      },
    });

    // An admin status change can invalidate a community-decided status, so the
    // effective status is re-derived rather than assumed.
    if (input.status_id !== undefined && input.status_id !== existing.status_id) {
      await recomputeEffectiveStatus(prisma, params.id);
    }

    const updated = await prisma.post.findUnique({
      where: { id: params.id },
      include: { category: true, status: true, effective_status: true, tags: true },
    });

    return DataResponse.json(updated);
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const admin = await requireAdmin(request, "posts:delete");

    if (!admin.ok) {
      return admin.response;
    }

    const { env } = await getCloudflareContext({ async: true });
    const prisma = getPrisma(env.DB);

    const existing = await prisma.post.findUnique({
      where: { id: params.id },
      select: { id: true },
    });

    if (!existing) {
      return ErrorResponse.json("Post not found", { status: 404 });
    }

    await prisma.post.delete({ where: { id: params.id } });

    return DataResponse.json({ success: true });
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}
