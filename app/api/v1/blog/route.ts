import { NextRequest } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import ErrorResponse from "@/lib/backend/response/ErrorResponse";
import DataResponse from "@/lib/backend/response/DataResponse";
import getPrisma from "@/lib/db/prisma";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { z } from "zod";

export const runtime = "edge";

const blogPostSchema = z.object({
  title: z.string().min(1).max(255),
  content: z.string().min(50),
  description: z.string().min(10).max(200),
  image_url: z.string().url().optional().or(z.literal("")),
  published: z.boolean().default(true),
  created_at: z.string().optional(),
});

export type BlogPost = z.infer<typeof blogPostSchema>;

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

    const postsWithAuthors = await Promise.all(
      posts.map(async (post) => {
        try {
          const user = await clerkClient().users.getUser(post.author_id);
          return {
            ...post,
            author: {
              username: user.username || `${user.firstName} ${user.lastName}`.trim(),
              imageUrl: user.imageUrl,
            }
          };
        } catch (error) {
          return {
            ...post,
            author: {
              username: "Anonymous",
              imageUrl: undefined
            }
          };
        }
      })
    );

    return DataResponse.json(postsWithAuthors);
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
      validatedData.image_url = null;
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
        created_at: validatedData.created_at ? new Date(validatedData.created_at) : undefined,
      },
    });

    return DataResponse.json(post);
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

    const body = await request.json();
    const { id, ...updateData } = body;
    const validatedData = blogPostSchema.parse(updateData);

    if (validatedData.image_url === "") {
      validatedData.image_url = null;
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