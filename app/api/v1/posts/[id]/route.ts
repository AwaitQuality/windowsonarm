import { NextRequest } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import ErrorResponse from "@/lib/backend/response/ErrorResponse";
import getPrisma from "@/lib/db/prisma";
import DataResponse from "@/lib/backend/response/DataResponse";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getAppById } from "@/lib/api";
import { recomputeEffectiveStatus } from "@/lib/backend/voting";
import { updatePostSchema } from "@/lib/schemas/post";
import { sendWebhook } from "@/lib/backend/discord";


export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const post = await getAppById(params.id);

    return DataResponse.json(post);
  } catch (error: any) {
    console.error("Error fetching post:", error);
    return ErrorResponse.json(error.message);
  }
}

export async function PUT(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const { userId } = await auth();

    if (!userId) {
      return ErrorResponse.json("User not found", {
        status: 401,
      });
    }

    const user = await (await clerkClient()).users.getUser(userId);

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

    const { env } = await getCloudflareContext({ async: true });
    const prisma = getPrisma(env.DB);

    // Get the current post to check if status changed
    const currentPost = await prisma.post.findUnique({
      where: { id: params.id },
      include: {
        status: true,
      },
    });

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

    // An admin status change can invalidate a community-decided status.
    if (currentPost && currentPost.status_id !== validatedData.status_id) {
      await recomputeEffectiveStatus(prisma, params.id);
    }

    // If status has changed, notify Discord
    if (currentPost && currentPost.status_id !== validatedData.status_id) {
      await sendWebhook(env.DISCORD_WEBHOOK_URL, {
        embeds: [
          {
            title: "App Status Updated",
            description: `**${updatedPost.title}** status has been updated`,
            color: parseInt(updatedPost.status.color.replace("#", ""), 16),
            fields: [
              {
                name: "Previous Status",
                value: currentPost.status.name,
                inline: true,
              },
              {
                name: "New Status",
                value: updatedPost.status.name,
                inline: true,
              },
              {
                name: "Updated By",
                value:
                  user.username || `${user.firstName} ${user.lastName}`.trim(),
                inline: true,
              },
            ],
            timestamp: new Date().toISOString(),
          },
        ],
      });
    }

    return DataResponse.json(updatedPost);
  } catch (error: any) {
    console.error("Error updating post:", error);
    return ErrorResponse.json(error.message);
  }
}

export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const { userId } = await auth();

    if (!userId) {
      return ErrorResponse.json("User not found", {
        status: 401,
      });
    }

    const user = await (await clerkClient()).users.getUser(userId);

    if (!user || user.publicMetadata.role !== "admin") {
      return ErrorResponse.json("Unauthorized", {
        status: 401,
      });
    }

    const { env } = await getCloudflareContext({ async: true });
    const prisma = getPrisma(env.DB);

    await prisma.post.delete({
      where: { id: params.id },
    });

    return DataResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting post:", error);
    return ErrorResponse.json(error.message);
  }
}
