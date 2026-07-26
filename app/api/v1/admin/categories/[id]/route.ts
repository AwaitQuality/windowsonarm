import { NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import DataResponse from "@/lib/backend/response/DataResponse";
import ErrorResponse from "@/lib/backend/response/ErrorResponse";
import getPrisma from "@/lib/db/prisma";
import { handleRouteError } from "@/lib/backend/errors";
import { requireAdmin } from "@/lib/backend/auth";
import { updateCategorySchema } from "@/lib/schemas/taxonomy";

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

    const input = updateCategorySchema.parse(await request.json());

    const { env } = await getCloudflareContext({ async: true });
    const prisma = getPrisma(env.DB);

    const existing = await prisma.category.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return ErrorResponse.json("Category not found", { status: 404 });
    }

    const category = await prisma.category.update({
      where: { id: params.id },
      data: input,
    });

    return DataResponse.json(category);
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

    const { env } = await getCloudflareContext({ async: true });
    const prisma = getPrisma(env.DB);

    const existing = await prisma.category.findUnique({
      where: { id: params.id },
      include: { _count: { select: { posts: true } } },
    });

    if (!existing) {
      return ErrorResponse.json("Category not found", { status: 404 });
    }

    // Post.categoryId is ON DELETE CASCADE, so the driver would happily take
    // every app in this category with it — along with their reviews, upvotes and
    // views. A non-empty category therefore has to be emptied deliberately.
    if (existing._count.posts > 0) {
      return ErrorResponse.json(
        `This category still holds ${existing._count.posts} app(s). Move them first — deleting it would delete them too.`,
        { status: 409 }
      );
    }

    await prisma.category.delete({ where: { id: params.id } });

    return DataResponse.json({ success: true });
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}
