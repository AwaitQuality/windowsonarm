import { NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import DataResponse from "@/lib/backend/response/DataResponse";
import ErrorResponse from "@/lib/backend/response/ErrorResponse";
import getPrisma from "@/lib/db/prisma";
import { handleRouteError } from "@/lib/backend/errors";
import { requireAdmin } from "@/lib/backend/auth";
import { updateTagSchema } from "@/lib/schemas/taxonomy";

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

    const input = updateTagSchema.parse(await request.json());

    const { env } = await getCloudflareContext({ async: true });
    const prisma = getPrisma(env.DB);

    const existing = await prisma.tag.findUnique({ where: { id: params.id } });

    if (!existing) {
      return ErrorResponse.json("Tag not found", { status: 404 });
    }

    const tag = await prisma.tag.update({
      where: { id: params.id },
      data: input,
    });

    return DataResponse.json(tag);
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}

/**
 * Tags relate to posts many-to-many, so deleting one only detaches it. No post
 * is lost, which is why this needs no in-use guard the way categories do.
 */
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

    const { env } = await getCloudflareContext({ async: true });
    const prisma = getPrisma(env.DB);

    const existing = await prisma.tag.findUnique({
      where: { id: params.id },
      select: { id: true },
    });

    if (!existing) {
      return ErrorResponse.json("Tag not found", { status: 404 });
    }

    await prisma.tag.delete({ where: { id: params.id } });

    return DataResponse.json({ success: true });
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}
