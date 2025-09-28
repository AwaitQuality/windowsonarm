import { NextRequest } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import ErrorResponse from "@/lib/backend/response/ErrorResponse";
import DataResponse from "@/lib/backend/response/DataResponse";
import getPrisma from "@/lib/db/prisma";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { blogPostSchema, UpdateBlogPostRequest } from "@/lib/backend/schemas/blog-post";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  try {
    const { env } = getRequestContext();
    const prisma = getPrisma(env.DB);

    const posts = await prisma.blogPost.findMany({
      where: {
        published: true,
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    const authorIds = posts.map((post) => post.author_id);
    const users = await clerkClient().users.getUserList({ userId: authorIds });
    const usersById = new Map(users.data.map((user) => [user.id, user]));

    const postsWithAuthors = posts.map((post) => {
      const user = usersById.get(post.author_id);
      return {
        ...post,
        author: user
          ? {
              username:
                user.username || `${user.firstName} ${user.lastName}`.trim(),
              imageUrl: user.imageUrl,
            }
          : {
              username: "Anonymous",
              imageUrl: undefined,
            },
      };
    });

    return DataResponse.json(postsWithAuthors);
  } catch (error: any) {
    return ErrorResponse.json(error.message);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return ErrorResponse.json("Unauthorized", { status: 401 });
    }

    const user = await clerkClient().users.getUser(userId);
    if (user.publicMetadata.role !== "admin") {
      return ErrorResponse.json("Unauthorized", { status: 401 });
    }

    const body = (await request.json()) as UpdateBlogPostRequest;
    const { id, ...updateData } = body;
    const validatedData = blogPostSchema.parse(updateData);

    if (validatedData.image_url === "") {
      validatedData.image_url = undefined;
    }

    const { env } = getRequestContext();
    const prisma = getPrisma(env.DB);

    const post = await prisma.blogPost.update({
      where: { id },
      data: {
        ...validatedData,
        created_at: validatedData.created_at ? new Date(validatedData.created_at) : undefined,
      },
    });

    return DataResponse.json(post);
  } catch (error: any) {
    return ErrorResponse.json(error.message);
  }
}

export async function POST(request: NextRequest) {
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

    if (validatedData.image_url === "") {
      validatedData.image_url = undefined;
    }

    if (!validatedData.description) {
      validatedData.description = validatedData.content
        .slice(0, 197)
        .trim() + "...";
    }

    const { env } = getRequestContext();
    const prisma = getPrisma(env.DB);

    const post = await prisma.blogPost.create({
      data: {
        ...validatedData,
        author_id: userId,
        created_at: validatedData.created_at
          ? new Date(validatedData.created_at)
          : undefined,
      },
    });

    return DataResponse.json(post);
  } catch (error: any) {
    return ErrorResponse.json(error.message);
  }
} 