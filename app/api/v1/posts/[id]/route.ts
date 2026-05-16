import { NextRequest } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import ErrorResponse from "@/lib/backend/response/ErrorResponse";
import getPrisma from "@/lib/db/prisma";
import DataResponse from "@/lib/backend/response/DataResponse";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { getAppById } from "@/lib/api";
import { updatePostSchema } from "@/lib/schemas/post";
import { recomputeEffectiveStatus } from "@/lib/backend/voting";

export const runtime = "edge";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const post = await getAppById(params.id);
    return DataResponse.json(post);
  } catch (error: any) {
    console.error("Error fetching post:", error);
    return ErrorResponse.json(error.message);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return ErrorResponse.json("Sign in required", { status: 401 });
    }

    const user = await clerkClient().users.getUser(userId);
    if (user.publicMetadata.role !== "admin") {
      return ErrorResponse.json("Admin only", { status: 403 });
    }

    const validatedData = updatePostSchema.parse(await request.json());

    const { env } = getRequestContext();
    const prisma = getPrisma(env.DB);

    await prisma.post.update({
      where: { id: params.id },
      data: {
        ...validatedData,
        tags: {
          set: [],
          connectOrCreate:
            validatedData.tags?.map((tag) => ({
              where: { name: tag },
              create: { name: tag },
            })) || [],
        },
        updated_at: new Date(),
      },
    });

    await recomputeEffectiveStatus(prisma, params.id);

    const updatedPost = await prisma.post.findUnique({
      where: { id: params.id },
      include: {
        category: true,
        status: true,
        effective_status: true,
        tags: true,
      },
    });

    return DataResponse.json(updatedPost);
  } catch (error: any) {
    console.error("Error updating post:", error);
    return ErrorResponse.json(error.message);
  }
}
