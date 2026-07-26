import getPrisma from "@/lib/db/prisma";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { lookupClerkUsersByIds } from "@/lib/backend/clerk";
import type { BlogPostWithAuthor } from "@/lib/types/prisma/prisma-types";

/**
 * Published blog posts with their authors resolved.
 *
 * Shared by /api/v1/blog and the homepage, so the server render and the client
 * hook cannot drift, and the homepage no longer needs a second request for a
 * list it just rendered.
 */
export const listPublishedBlogPosts = async (): Promise<
  BlogPostWithAuthor[]
> => {
  const { env } = await getCloudflareContext({ async: true });
  const prisma = getPrisma(env.DB);

  const posts = await prisma.blogPost.findMany({
    where: { published: true },
    orderBy: { created_at: "desc" },
  });

  // Shared lookup: dedupes the ids and skips the Clerk call when there are
  // none, which would otherwise list every user in the instance.
  const usersById = await lookupClerkUsersByIds(
    posts.map((post) => post.author_id)
  );

  return posts.map((post) => ({
    ...post,
    author:
      usersById.get(post.author_id) ?? {
        username: "Anonymous",
        imageUrl: undefined,
      },
  }));
};
