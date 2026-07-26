import { NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import DataResponse from "@/lib/backend/response/DataResponse";
import ErrorResponse from "@/lib/backend/response/ErrorResponse";
import getPrisma from "@/lib/db/prisma";
import { handleRouteError } from "@/lib/backend/errors";
import { requireAdmin } from "@/lib/backend/auth";
import { updateStatusSchema } from "@/lib/schemas/taxonomy";
import { PENDING_STATUS_ID } from "@/lib/schemas/post";
import { recomputeEffectiveStatus } from "@/lib/backend/voting";

/** Status ids are integers, so a non-numeric path segment is a 404, not a 500. */
const parseId = (raw: string): number | null => {
  const id = Number(raw);
  return Number.isInteger(id) ? id : null;
};

export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const admin = await requireAdmin(request, "taxonomy:write");

    if (!admin.ok) {
      return admin.response;
    }

    const id = parseId(params.id);
    if (id === null) {
      return ErrorResponse.json("Status not found", { status: 404 });
    }

    const input = updateStatusSchema.parse(await request.json());

    const { env } = await getCloudflareContext({ async: true });
    const prisma = getPrisma(env.DB);

    const existing = await prisma.status.findUnique({ where: { id } });

    if (!existing) {
      return ErrorResponse.json("Status not found", { status: 404 });
    }

    const status = await prisma.status.update({ where: { id }, data: input });

    return DataResponse.json(status);
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
    const admin = await requireAdmin(request, "taxonomy:write");

    if (!admin.ok) {
      return admin.response;
    }

    const id = parseId(params.id);
    if (id === null) {
      return ErrorResponse.json("Status not found", { status: 404 });
    }

    // The pending pseudo-status is load-bearing: post creation, the public
    // listing filter and the review queue all reference it by id.
    if (id === PENDING_STATUS_ID) {
      return ErrorResponse.json("The pending status cannot be deleted", {
        status: 409,
      });
    }

    const { env } = await getCloudflareContext({ async: true });
    const prisma = getPrisma(env.DB);

    const existing = await prisma.status.findUnique({
      where: { id },
      include: {
        _count: { select: { posts: true, effective_posts: true } },
      },
    });

    if (!existing) {
      return ErrorResponse.json("Status not found", { status: 404 });
    }

    // Both FKs are ON DELETE RESTRICT, so the driver would refuse anyway — but
    // it would do so as an opaque constraint error. Say which posts are in the
    // way instead, so the caller knows what to reassign.
    const inUse = existing._count.posts + existing._count.effective_posts;

    if (inUse > 0) {
      return ErrorResponse.json(
        `This status is still used by ${inUse} post(s). Reassign them first.`,
        { status: 409 }
      );
    }

    // Status votes have no FK cascade to clean them up, and a vote pointing at a
    // deleted status would break every recompute that tallies it. Removing them
    // changes those posts' tallies, so each affected post is recomputed —
    // otherwise a post could keep an effective status that nothing now supports.
    const affected = await prisma.statusVote.findMany({
      where: { status_id: id },
      select: { post_id: true },
      distinct: ["post_id"],
    });

    await prisma.statusVote.deleteMany({ where: { status_id: id } });
    await prisma.status.delete({ where: { id } });

    for (const { post_id } of affected) {
      await recomputeEffectiveStatus(prisma, post_id);
    }

    return DataResponse.json({ success: true });
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}
