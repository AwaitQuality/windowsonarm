import { NextRequest } from "next/server";
import { z } from "zod";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import DataResponse from "@/lib/backend/response/DataResponse";
import getPrisma from "@/lib/db/prisma";
import { handleRouteError } from "@/lib/backend/errors";
import { requireAdmin } from "@/lib/backend/auth";
import { lookupClerkUsersByIds } from "@/lib/backend/clerk";

const listQuerySchema = z.object({
  /** Absent means "both" — the reason this route exists at all. */
  published: z.enum(["true", "false"]).optional(),
});

/**
 * The admin blog listing. The public GET /api/v1/blog hard-filters to
 * `published: true`, so drafts are invisible there and unreachable by any
 * script that needs to find one.
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request, "blog:read");

    if (!admin.ok) {
      return admin.response;
    }

    const { published } = listQuerySchema.parse({
      published: request.nextUrl.searchParams.get("published") || undefined,
    });

    const { env } = await getCloudflareContext({ async: true });
    const prisma = getPrisma(env.DB);

    const posts = await prisma.blogPost.findMany({
      where:
        published === undefined ? {} : { published: published === "true" },
      orderBy: { created_at: "desc" },
    });

    const usersById = await lookupClerkUsersByIds(
      posts.map((post) => post.author_id)
    );

    const withAuthors = posts.map((post) => ({
      ...post,
      author: usersById.get(post.author_id) ?? null,
    }));

    return DataResponse.json(withAuthors);
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}
