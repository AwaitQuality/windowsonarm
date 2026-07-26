import { NextRequest } from "next/server";
import { z } from "zod";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import DataResponse from "@/lib/backend/response/DataResponse";
import ErrorResponse from "@/lib/backend/response/ErrorResponse";
import getPrisma from "@/lib/db/prisma";
import { handleRouteError } from "@/lib/backend/errors";
import { requireAdmin } from "@/lib/backend/auth";
import { lookupClerkUsersByIds } from "@/lib/backend/clerk";
import { adminCreatePostSchema, PENDING_STATUS_ID } from "@/lib/schemas/post";
import type { ClerkUserSummary } from "@/lib/types/clerk";

const PAGE_SIZE = 50;

/**
 * The admin listing, as returned to API callers. Deliberately not `FullPost`:
 * that type carries the `userUpvoted` flag, which is meaningless for a key with
 * no user behind it.
 */
export interface AdminPostSummary {
  id: string;
  title: string;
  company: string;
  description: string;
  categoryId: string;
  status_id: number;
  status_hint: number | null;
  effective_status_id: number;
  community_voted: boolean;
  app_url: string | null;
  community_url: string | null;
  banner_url: string | null;
  icon_url: string | null;
  discord_forum_post_id: string | null;
  upvotes_count: number;
  views_count: number;
  created_at: Date;
  updated_at: Date;
  user_id: string | null;
  user: ClerkUserSummary | null;
  tags: string[];
}

export interface AdminPostsResponse {
  posts: AdminPostSummary[];
  nextCursor: string | null;
}

const optionalQueryString = z.string().trim().min(1).max(200).optional();

const listQuerySchema = z.object({
  cursor: optionalQueryString,
  category: optionalQueryString,
  search: optionalQueryString,
  status: z.coerce.number().int().optional(),
  /**
   * Convenience filter for the review queue. Unlike the public route, an admin
   * can also list *everything*, pending included — which is the default here.
   */
  pending: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === "true"),
});

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request, "posts:read");

    if (!admin.ok) {
      return admin.response;
    }

    const raw = (key: string): string | undefined => {
      const value = request.nextUrl.searchParams.get(key);
      return !value || value === "undefined" ? undefined : value;
    };

    const query = listQuerySchema.parse({
      cursor: raw("cursor"),
      category: raw("category"),
      search: raw("search"),
      status: raw("status"),
      pending: raw("pending"),
    });

    const { env } = await getCloudflareContext({ async: true });
    const prisma = getPrisma(env.DB);

    const posts = await prisma.post.findMany({
      take: PAGE_SIZE,
      cursor: query.cursor ? { id: query.cursor } : undefined,
      skip: query.cursor ? 1 : 0,
      where: {
        AND: [
          query.category ? { categoryId: query.category } : {},
          query.status !== undefined
            ? { effective_status_id: query.status }
            : {},
          query.pending ? { effective_status_id: PENDING_STATUS_ID } : {},
          query.search
            ? {
                OR: [
                  { title: { contains: query.search } },
                  { description: { contains: query.search } },
                  { company: { contains: query.search } },
                ],
              }
            : {},
        ],
      },
      include: { tags: { select: { name: true } } },
      orderBy: [{ created_at: "desc" }, { id: "asc" }],
    });

    const userMap = await lookupClerkUsersByIds(
      posts.map((post) => post.user_id)
    );

    const summaries: AdminPostSummary[] = posts.map((post) => ({
      id: post.id,
      title: post.title,
      company: post.company,
      description: post.description,
      categoryId: post.categoryId,
      status_id: post.status_id,
      status_hint: post.status_hint,
      effective_status_id: post.effective_status_id,
      community_voted: post.community_voted,
      app_url: post.app_url,
      community_url: post.community_url,
      banner_url: post.banner_url,
      icon_url: post.icon_url,
      discord_forum_post_id: post.discord_forum_post_id,
      upvotes_count: post.upvotes_count,
      views_count: post.views_count,
      created_at: post.created_at,
      updated_at: post.updated_at,
      user_id: post.user_id,
      user: post.user_id ? (userMap.get(post.user_id) ?? null) : null,
      tags: post.tags.map((tag) => tag.name),
    }));

    const response: AdminPostsResponse = {
      posts: summaries,
      nextCursor:
        posts.length === PAGE_SIZE ? (posts[posts.length - 1]?.id ?? null) : null,
    };

    return DataResponse.json(response);
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}

/**
 * Admin-authored creation. Unlike the public POST /api/v1/posts, this sets the
 * status directly instead of forcing the post through the pending queue — the
 * whole point of an admin creating it is that it is already reviewed.
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request, "posts:write");

    if (!admin.ok) {
      return admin.response;
    }

    const input = adminCreatePostSchema.parse(await request.json());

    const { env } = await getCloudflareContext({ async: true });
    const prisma = getPrisma(env.DB);

    const [status, category] = await Promise.all([
      prisma.status.findUnique({ where: { id: input.status_id } }),
      prisma.category.findUnique({ where: { id: input.categoryId } }),
    ]);

    // Checked up front so a bad reference reads as a 400 naming the field,
    // rather than an opaque foreign-key error from the driver.
    if (!status) {
      return ErrorResponse.json("Unknown status_id", { status: 400 });
    }
    if (!category) {
      return ErrorResponse.json("Unknown categoryId", { status: 400 });
    }

    const post = await prisma.post.create({
      data: {
        title: input.title,
        company: input.company,
        description: input.description,
        categoryId: input.categoryId,
        app_url: input.app_url || null,
        community_url: input.community_url || null,
        banner_url: input.banner_url || null,
        icon_url: input.icon_url || null,
        status_hint: input.status_hint ?? null,
        status_id: input.status_id,
        // No community vote exists yet, so the effective status is simply the
        // one the admin set. Keeping it non-null is what keeps the post visible
        // to the public listing filter.
        effective_status_id: input.status_id,
        user_id: input.user_id ?? admin.userId,
        tags: {
          connectOrCreate:
            input.tags?.map((tag) => ({
              where: { name: tag },
              create: { name: tag },
            })) ?? [],
        },
      },
      include: { tags: true, status: true, category: true },
    });

    return DataResponse.json(post, { status: 201 });
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}
