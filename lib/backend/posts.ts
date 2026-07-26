import getPrisma from "@/lib/db/prisma";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { FullPost } from "@/lib/types/prisma/prisma-types";
import { PENDING_STATUS_ID } from "@/lib/schemas/post";
import { lookupClerkUsersByIds } from "@/lib/backend/clerk";

export const POSTS_PER_PAGE = 40;

export interface PostsResponse {
  category: string | null;
  posts: FullPost[];
  nextCursor: string | null;
}

export interface ListPostsOptions {
  cursor?: string;
  category?: string;
  search?: string;
  status?: number;
  /** Whose upvote state to resolve. Null for anonymous callers. */
  userId?: string | null;
  /** Only true for an admin explicitly asking for the review queue. */
  includePending?: boolean;
}

/**
 * The public listing query.
 *
 * Lives here rather than in the route handler so the homepage can render the
 * first page on the server instead of the browser fetching /api/v1/posts a
 * moment after the HTML arrives — that round-trip was a second Worker
 * invocation and a second set of D1 queries for data the server already had.
 */
export const listPosts = async ({
  cursor,
  category,
  search,
  status,
  userId = null,
  includePending = false,
}: ListPostsOptions): Promise<PostsResponse> => {
  const { env } = await getCloudflareContext({ async: true });
  const prisma = getPrisma(env.DB);

  const posts = await prisma.post.findMany({
    take: POSTS_PER_PAGE,
    cursor: cursor ? { id: cursor } : undefined,
    where: {
      AND: [
        category ? { category: { id: category } } : {},
        status !== undefined ? { effective_status_id: status } : {},
        // Pending submissions are not public. The exclusion is always AND-ed in
        // unless an admin asked for the queue, so `?status=-1` returns nothing
        // rather than the review queue.
        includePending ? {} : { effective_status_id: { not: PENDING_STATUS_ID } },
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
      upvotes: userId ? { where: { user_id: userId }, take: 1 } : false,
      category: true,
    },
    skip: cursor ? 1 : 0,
    orderBy: [
      { upvotes_count: "desc" },
      { views_count: "desc" },
      { title: "asc" },
    ],
  });

  const withUpvoteState: FullPost[] = posts.map((post) => ({
    ...post,
    tags: [],
    userUpvoted: Boolean(post.upvotes && post.upvotes.length > 0),
    user: null,
    // Read from the same denormalised counters the query orders by: mixing
    // ordering by upvotes_count with a live _count let a post rank above
    // another while displaying a lower number.
    _count: {
      upvotes: post.upvotes_count,
      views: post.views_count,
    },
  }));

  const userMap = await lookupClerkUsersByIds(
    withUpvoteState.map((post) => post.user_id)
  );

  withUpvoteState.forEach((post) => {
    post.user = post.user_id ? userMap.get(post.user_id) ?? null : null;
  });

  return {
    category: category ?? null,
    posts: withUpvoteState,
    nextCursor:
      posts.length === POSTS_PER_PAGE ? posts[posts.length - 1]?.id ?? null : null,
  };
};
