import { NextRequest } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import ErrorResponse from "@/lib/backend/response/ErrorResponse";
import getPrisma from "@/lib/db/prisma";
import DataResponse from "@/lib/backend/response/DataResponse";
import { z } from "zod";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { getAppById } from "@/lib/api";

export const runtime = "edge";

const updatePostSchema = z.object({
  title: z.string().max(255),
  company: z.string().max(255),
  description: z.string(),
  tags: z.array(z.string()).max(3).optional(),
  app_url: z.string().optional().nullable(),
  banner_url: z.string().optional().nullable(),
  status_id: z.number(),
  icon_url: z.string().optional().nullable(),
  categoryId: z.string(),
});

export async function GET(
  request: NextRequest,
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
      return ErrorResponse.json("User not found", {
        status: 401,
      });
    }

    const user = await clerkClient().users.getUser(userId);

    if (!user) {
      return ErrorResponse.json("User not found", {
        status: 401,
      });
    }

    if (user.publicMetadata.role !== "admin") {
      return ErrorResponse.json("User is not an admin", {
        status: 401,
      });
    }

    const body = await request.json();
    const validatedData = updatePostSchema.parse(body);

    const { env } = getRequestContext();
    const prisma = getPrisma(env.DB);

    const updatedPost = await prisma.post.update({
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
      include: {
        category: true,
        status: true,
        tags: true,
      },
    });

    return DataResponse.json(updatedPost);
  } catch (error: any) {
    console.error("Error updating post:", error);
    return ErrorResponse.json(error.message);
  }
}
