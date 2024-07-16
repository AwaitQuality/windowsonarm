import { NextRequest } from "next/server";
import ErrorResponse from "@/lib/backend/response/ErrorResponse";
import DataResponse from "@/lib/backend/response/DataResponse";
import { FullPost } from "@/lib/types/prisma/prisma-types";
import { postRequest } from "@/components/contribute-button";
import getPrisma from "@/lib/db/prisma";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { auth, clerkClient, getAuth, User } from "@clerk/nextjs/server";

export const runtime = "edge";

const POSTS_PER_PAGE = 40; // Number of posts to fetch per batch

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
    let status = request.nextUrl.searchParams.get("status");
    const search = request.nextUrl.searchParams.get("search");

    if (status === "undefined") {
      status = null;
    }

    const { env } = getRequestContext();

    const prisma = getPrisma(env.DATABASE_URL);

    const posts = await prisma.post.findMany({
      take: POSTS_PER_PAGE,
      cursor: cursor ? { id: cursor } : undefined,
      where: {
        AND: [
          category ? { category: { id: category } } : {},
          status ? { status: parseInt(status) } : { status: { not: -1 } },
          search
            ? {
                OR: [
                  { title: { contains: search, mode: "insensitive" } },
                  { description: { contains: search, mode: "insensitive" } },
                  { company: { contains: search, mode: "insensitive" } },
                  { tags: { hasSome: [search] } },
                ],
              }
            : {},
        ],
      },
      include: {
        statusRel: true,
        upvotes: user.userId
          ? {
              where: {
                user_id: user.userId,
              },
              take: 1,
            }
          : false,
        category: true,
        _count: {
          select: { upvotes: true },
        },
      },
      skip: cursor ? 1 : 0,
      orderBy: [
        {
          upvotes: {
            _count: "desc",
          },
        },
        {
          title: "asc",
        },
      ],
    });

    const postsWithUpvoteStatus: FullPost[] = posts.map((post) => ({
      ...post,
      userUpvoted: post.upvotes?.length > 0,
      user: null,
    }));

    const userIds = postsWithUpvoteStatus
      .map((post) => post.user_id)
      .filter((userId) => userId) as string[];

    const users = await clerkClient().users.getUserList({
      userId: userIds,
      limit: 100,
    });

    users.data.forEach((user) => {
      postsWithUpvoteStatus.forEach((post) => {
        if (post.user_id === user.id) {
          post.user = user;
        }
      });
    });

    const nextCursor =
      posts.length === POSTS_PER_PAGE ? posts[posts.length - 1]?.id : null;

    const response: PostsResponse = {
      category,
      posts: postsWithUpvoteStatus,
      nextCursor,
    };

    return DataResponse.json(response);
  } catch (error: any) {
    return ErrorResponse.json(error.message);
  }
}

export async function POST(request: NextRequest) {
  try {
    const postRequest = (await request.json()) as postRequest;

    const userId = auth().userId;

    if (!userId) {
      return ErrorResponse.json("User not found");
    }

    const { env } = getRequestContext();

    const prisma = getPrisma(env.DATABASE_URL);

    const status = await prisma.status.findUnique({
      where: {
        id: -1,
      },
    });

    if (!status) {
      return ErrorResponse.json("Testing status (-1) not found");
    }

    const post = await prisma.post.create({
      data: {
        title: postRequest.title,
        description: postRequest.description,
        company: postRequest.company,
        categoryId: postRequest.categoryId,
        tags: postRequest.tags,
        app_url: postRequest.app_url,
        banner_url: postRequest.banner_url,
        icon_url: postRequest.icon_url,
        status: -1,
        user_id: userId,
      },
    });

    return DataResponse.json(post);
  } catch (error: any) {
    return ErrorResponse.json(error.message);
  }
}
