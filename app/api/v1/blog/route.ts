import { NextRequest } from "next/server";
import DataResponse from "@/lib/backend/response/DataResponse";
import ErrorResponse from "@/lib/backend/response/ErrorResponse";
import getPrisma from "@/lib/db/prisma";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { z } from "zod";
import { blogPostSchema } from "@/lib/backend/schemas/blog-post";
import { handleRouteError } from "@/lib/backend/errors";
import { requireAdmin } from "@/lib/backend/auth";
import { lookupClerkUsersByIds } from "@/lib/backend/clerk";


/** The id travels in the body on this route, so it has to be validated with it. */
const updateBlogPostSchema = blogPostSchema.extend({
  id: z.string().min(1, "Blog post id is required"),
});

export async function GET() {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const prisma = getPrisma(env.DB);

    const posts = await prisma.blogPost.findMany({
      where: {
        published: true,
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    // Shared lookup: dedupes the ids and skips the Clerk call when there are
    // none, which would otherwise list every user in the instance.
    const usersById = await lookupClerkUsersByIds(
      posts.map((post) => post.author_id)
    );

    const postsWithAuthors = posts.map((post) => {
      const user = usersById.get(post.author_id);
      return {
        ...post,
        author: user
          ? user
          : {
              username: "Anonymous",
              imageUrl: undefined,
            },
      };
    });

    return DataResponse.json(postsWithAuthors);
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdmin();

    if (!admin.ok) {
      return admin.response;
    }

    const body = await request.json();
    const { id, ...validatedData } = updateBlogPostSchema.parse(body);

    if (validatedData.image_url === "") {
      validatedData.image_url = undefined;
    }

    const { env } = await getCloudflareContext({ async: true });
    const prisma = getPrisma(env.DB);

    const existing = await prisma.blogPost.findUnique({ where: { id } });

    if (!existing) {
      return ErrorResponse.json("Blog post not found", { status: 404 });
    }

    const post = await prisma.blogPost.update({
      where: { id },
      data: {
        ...validatedData,
        created_at: validatedData.created_at ? new Date(validatedData.created_at) : undefined,
      },
    });

    return DataResponse.json(post);
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();

    if (!admin.ok) {
      return admin.response;
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

    const { env } = await getCloudflareContext({ async: true });
    const prisma = getPrisma(env.DB);

    const post = await prisma.blogPost.create({
      data: {
        ...validatedData,
        author_id: admin.userId,
        created_at: validatedData.created_at
          ? new Date(validatedData.created_at)
          : undefined,
      },
    });

    return DataResponse.json(post, { status: 201 });
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}
