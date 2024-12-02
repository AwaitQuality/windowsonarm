import { NextRequest } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import ErrorResponse from "@/lib/backend/response/ErrorResponse";
import DataResponse from "@/lib/backend/response/DataResponse";
import getPrisma from "@/lib/db/prisma";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { blogPostSchema } from "@/lib/backend/schemas/blog-post";

export const runtime = "edge";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return ErrorResponse.json("Unauthorized", { status: 401 });
    }

    const user = await clerkClient().users.getUser(userId);
    if (user.publicMetadata.role !== "admin") {
      return ErrorResponse.json("Unauthorized", { status: 401 });
    }

    const { env } = getRequestContext();
    const prisma = getPrisma(env.DB);

    await prisma.blogPost.delete({
      where: { id: params.id },
    });

    return DataResponse.json({ success: true });
  } catch (error: any) {
    return ErrorResponse.json(error.message);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return ErrorResponse.json("Unauthorized", { status: 401 });
    }

    const user = await clerkClient().users.getUser(userId);
    if (user.publicMetadata.role !== "admin") {
      return ErrorResponse.json("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const validatedData = blogPostSchema.parse(body);

    const { env } = getRequestContext();
    const prisma = getPrisma(env.DB);

    const post = await prisma.blogPost.update({
      where: { id: params.id },
      data: {
        ...validatedData,
        updated_at: new Date(),
      },
    });

    return DataResponse.json(post);
  } catch (error: any) {
    return ErrorResponse.json(error.message);
  }
} 