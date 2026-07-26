import { NextRequest } from "next/server";
import DataResponse from "@/lib/backend/response/DataResponse";
import getPrisma from "@/lib/db/prisma";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { blogPostSchema } from "@/lib/backend/schemas/blog-post";
import { handleRouteError } from "@/lib/backend/errors";
import { requireAdmin } from "@/lib/backend/auth";


export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const admin = await requireAdmin(request, "blog:delete");

    if (!admin.ok) {
      return admin.response;
    }

    const { env } = await getCloudflareContext({ async: true });
    const prisma = getPrisma(env.DB);

    await prisma.blogPost.delete({
      where: { id: params.id },
    });

    return DataResponse.json({ success: true });
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}

export async function PUT(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const admin = await requireAdmin(request, "blog:write");

    if (!admin.ok) {
      return admin.response;
    }

    const body = await request.json();
    const validatedData = blogPostSchema.parse(body);

    const { env } = await getCloudflareContext({ async: true });
    const prisma = getPrisma(env.DB);

    const post = await prisma.blogPost.update({
      where: { id: params.id },
      data: {
        ...validatedData,
        updated_at: new Date(),
      },
    });

    return DataResponse.json(post);
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}
