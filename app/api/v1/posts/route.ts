import { NextRequest } from "next/server";
import ErrorResponse from "@/lib/backend/response/ErrorResponse";
import DataResponse from "@/lib/backend/response/DataResponse";
import { FullPost } from "@/lib/types/prisma/prisma-types";
import getPrisma from "@/lib/db/prisma";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { auth, getAuth } from "@clerk/nextjs/server";
import axios from "axios";
import { createPostSchema, PENDING_STATUS_ID } from "@/lib/schemas/post";
import { recomputeEffectiveStatus } from "@/lib/backend/voting";
import { lookupClerkUsersByIds } from "@/lib/hooks/useClerkUsersByPostIds";

export const runtime = "edge";

const POSTS_PER_PAGE = 40;

export interface PostsResponse {
  category: string | null;
  posts: FullPost[];
  nextCursor: string | null;
}

export async function GET(request: NextRequest) {
  try {
    const user = getAuth(request);

    const cursor = request.nextUrl.searchParams.get("cursor") || "";
    const category = request.nextUrl.searchParams.get("category");
    const statusParam = request.nextUrl.searchParams.get("status");
    const status =
      statusParam && statusParam !== "undefined" ? parseInt(statusParam) : null;
    const search = request.nextUrl.searchParams.get("search");

    const { env } = getRequestContext();
    const prisma = getPrisma(env.DB);

    const posts = await prisma.post.findMany({
      take: POSTS_PER_PAGE,
      cursor: cursor ? { id: cursor } : undefined,
      where: {
        AND: [
          category ? { category: { id: category } } : {},
          status !== null
            ? { effective_status_id: status }
            : { effective_status_id: { not: PENDING_STATUS_ID } },
          search
            ? {
                OR: [
                  { title: { contains: search } },
                  { description: { contains: search } },
                  { company: { contains: search } },
                ],
              }
            : {},
        ],
      },
      include: {
        status: true,
        effective_status: true,
        upvotes: user.userId
          ? { where: { user_id: user.userId }, take: 1 }
          : false,
        category: true,
        _count: { select: { upvotes: true } },
      },
      skip: cursor ? 1 : 0,
      orderBy: [{ upvotes: { _count: "desc" } }, { title: "asc" }],
    });

    const userMap = await lookupClerkUsersByIds(posts.map((p) => p.user_id));

    const postsWithUserData: FullPost[] = posts.map((post) => ({
      ...post,
      tags: [],
      userUpvoted: Boolean(post.upvotes && post.upvotes.length > 0),
      user: post.user_id ? userMap.get(post.user_id) ?? null : null,
    }));

    const nextCursor =
      posts.length === POSTS_PER_PAGE ? posts[posts.length - 1]?.id : null;

    return DataResponse.json<PostsResponse>({
      category,
      posts: postsWithUserData,
      nextCursor,
    });
  } catch (error: any) {
    return ErrorResponse.json(error.message);
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = auth().userId;
    if (!userId) return ErrorResponse.json("Sign in required", { status: 401 });

    const body = createPostSchema.parse(await request.json());

    const { env } = getRequestContext();
    const prisma = getPrisma(env.DB);

    const pendingStatus = await prisma.status.findUnique({
      where: { id: PENDING_STATUS_ID },
    });
    if (!pendingStatus) {
      return ErrorResponse.json("Pending status (-1) not found");
    }

    const tagObjects = body.tags
      ? await Promise.all(
          body.tags.map((tagName) =>
            prisma.tag.upsert({
              where: { name: tagName },
              update: {},
              create: { name: tagName },
            }),
          ),
        )
      : [];

    const statusHint =
      body.status_hint && body.status_hint !== ""
        ? parseInt(body.status_hint)
        : null;

    const post = await prisma.post.create({
      data: {
        title: body.title,
        description: body.description,
        company: body.company,
        categoryId: body.categoryId,
        app_url: body.app_url || null,
        banner_url: body.banner_url || null,
        icon_url: body.icon_url || null,
        status_hint: statusHint,
        status_id: PENDING_STATUS_ID,
        effective_status_id: PENDING_STATUS_ID,
        user_id: userId,
        tags: { connect: tagObjects.map((tag) => ({ id: tag.id })) },
      },
      include: { tags: true },
    });

    await recomputeEffectiveStatus(prisma, post.id);

    if (env.DISCORD_FORUM_CHANNEL_ID && env.DISCORD_BOT_TOKEN) {
      try {
        const forumPost = await axios.post(
          `https://discord.com/api/v10/channels/${env.DISCORD_FORUM_CHANNEL_ID}/threads`,
          {
            name: `Discussion for ${post.title}`,
            auto_archive_duration: 10080,
            message: {
              content: `A new app has been added: ${post.title}\n\nDescription: ${post.description}\n\nDiscuss this app here!`,
            },
          },
          {
            headers: {
              Authorization: `Bot ${env.DISCORD_BOT_TOKEN}`,
              "Content-Type": "application/json",
            },
          },
        );

        await prisma.post.update({
          where: { id: post.id },
          data: { discord_forum_post_id: forumPost.data.id },
        });
      } catch (discordError) {
        console.error("Discord forum thread creation failed", discordError);
      }
    }

    return DataResponse.json(post);
  } catch (error: any) {
    console.error(error);
    return ErrorResponse.json(error.message);
  }
}
