import { NextRequest } from "next/server";
import { z } from "zod";
import ErrorResponse from "@/lib/backend/response/ErrorResponse";
import DataResponse from "@/lib/backend/response/DataResponse";
import getPrisma from "@/lib/db/prisma";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { auth, getAuth } from "@clerk/nextjs/server";
import { createForumThread } from "@/lib/backend/discord";
import { createPostSchema, PENDING_STATUS_ID } from "@/lib/schemas/post";
import { handleRouteError } from "@/lib/backend/errors";
import { isAdminRequest } from "@/lib/backend/auth";
import { listPosts } from "@/lib/backend/posts";


/**
 * Query params come straight from the URL, so a junk value must degrade to
 * "no filter" instead of failing the request — hence `.catch(undefined)`.
 */
const optionalQueryString = z
  .string()
  .trim()
  .min(1)
  .max(200)
  .optional()
  .catch(undefined);

const listPostsQuerySchema = z.object({
  cursor: optionalQueryString,
  category: optionalQueryString,
  search: optionalQueryString,
  status: z.coerce.number().int().optional().catch(undefined),
});

export async function GET(request: NextRequest) {
  try {
    const user = getAuth(request);

    // Absent params must arrive as `undefined`, not "" or the literal string
    // "undefined" the client sometimes sends: `z.coerce.number()` turns both of
    // those into 0, which is a real status id.
    const rawParam = (key: string): string | undefined => {
      const value = request.nextUrl.searchParams.get(key);
      return !value || value === "undefined" ? undefined : value;
    };

    const { cursor, category, search, status } = listPostsQuerySchema.parse({
      cursor: rawParam("cursor"),
      category: rawParam("category"),
      search: rawParam("search"),
      status: rawParam("status"),
    });

    return DataResponse.json(
      await listPosts({
        cursor,
        category,
        search,
        status,
        userId: user.userId,
      })
    );
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return ErrorResponse.json("Authentication required", { status: 401 });
    }

    const postRequest = await request.json();

    // Validate request data
    const validatedData = createPostSchema.parse(postRequest);

    const { env } = await getCloudflareContext({ async: true });

    const prisma = getPrisma(env.DB);

    const status = await prisma.status.findUnique({
      where: {
        id: PENDING_STATUS_ID,
      },
    });

    if (!status) {
      // Missing seed data is a server misconfiguration, not a bad request.
      return ErrorResponse.json("Submissions are unavailable right now", {
        status: 500,
      });
    }

    const post = await prisma.post.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        company: validatedData.company,
        categoryId: validatedData.categoryId,
        app_url: validatedData.app_url || null,
        community_url: validatedData.community_url || null,
        banner_url: validatedData.banner_url || null,
        icon_url: validatedData.icon_url || null,
        status_hint: validatedData.status_hint
          ? parseInt(validatedData.status_hint)
          : null,
        status_id: PENDING_STATUS_ID,
        // New posts start pending; the community can only move this once it votes.
        effective_status_id: PENDING_STATUS_ID,
        user_id: userId,
        tags: {
          connectOrCreate:
            validatedData.tags?.map((tag) => ({
              where: { name: tag },
              create: { name: tag },
            })) || [],
        },
      },
      include: {
        tags: true,
      },
    });

    // Open the Discord discussion thread for this app. A Discord outage must
    // not lose the post that was already created.
    try {
      const thread = await createForumThread(
        env.DISCORD_BOT_TOKEN,
        env.DISCORD_FORUM_CHANNEL_ID,
        {
          name: `Discussion for ${post.title}`,
          content: `A new app has been added: ${post.title}\n\nDescription: ${post.description}\n\nDiscuss this app here!`,
        }
      );

      await prisma.post.update({
        where: { id: post.id },
        data: { discord_forum_post_id: thread.id },
      });
    } catch (error) {
      console.error("Failed to create Discord forum thread:", error);
    }

    return DataResponse.json(post, { status: 201 });
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}
