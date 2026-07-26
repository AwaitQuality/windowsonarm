import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import ErrorResponse from "@/lib/backend/response/ErrorResponse";
import getPrisma from "@/lib/db/prisma";
import DataResponse from "@/lib/backend/response/DataResponse";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getAppById } from "@/lib/api";
import { recomputeEffectiveStatus } from "@/lib/backend/voting";
import { PENDING_STATUS_ID, updatePostSchema } from "@/lib/schemas/post";
import { sendWebhook } from "@/lib/backend/discord";
import { handleRouteError } from "@/lib/backend/errors";
import { isAdminRequest, requireAdmin } from "@/lib/backend/auth";


export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const post = await getAppById(params.id);

    if (!post) {
      return ErrorResponse.json("Post not found", { status: 404 });
    }

    // A pending submission is only visible to the person who submitted it and to
    // admins. Everyone else gets a 404 so the id itself stays unconfirmed.
    if (post.effective_status_id === PENDING_STATUS_ID) {
      const { userId } = await auth();
      const isSubmitter = !!userId && post.user_id === userId;

      if (!isSubmitter && !(await isAdminRequest(request, "posts:read"))) {
        return ErrorResponse.json("Post not found", { status: 404 });
      }
    }

    return DataResponse.json(post);
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}

export async function PUT(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const admin = await requireAdmin(request, "posts:write");

    if (!admin.ok) {
      return admin.response;
    }

    const { user } = admin;

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

    if (!currentPost) {
      return ErrorResponse.json("Post not found", { status: 404 });
    }

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

    const statusChanged = currentPost.status_id !== validatedData.status_id;

    // An admin status change can invalidate a community-decided status.
    if (statusChanged) {
      await recomputeEffectiveStatus(prisma, params.id);
    }

    // If status has changed, notify Discord
    if (statusChanged) {
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
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const admin = await requireAdmin(request, "posts:delete");

    if (!admin.ok) {
      return admin.response;
    }

    const { env } = await getCloudflareContext({ async: true });
    const prisma = getPrisma(env.DB);

    await prisma.post.delete({
      where: { id: params.id },
    });

    return DataResponse.json({ success: true });
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}
