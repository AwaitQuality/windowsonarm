import { auth } from "@clerk/nextjs/server";
import { FullPost } from "@/lib/types/prisma/prisma-types";
import getPrisma from "@/lib/db/prisma";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { lookupClerkUsersByIds } from "@/lib/hooks/useClerkUsersByPostIds";

export const getAppById = async (id: string): Promise<FullPost | null> => {
  const userId = auth().userId;
  const { env } = getRequestContext();
  const prisma = getPrisma(env.DB);

  try {
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        status: true,
        effective_status: true,
        tags: true,
        upvotes: userId
          ? { where: { user_id: userId }, take: 1 }
          : false,
        category: true,
        _count: { select: { upvotes: true } },
      },
    });

    if (!post) return null;

    const userMap = await lookupClerkUsersByIds([post.user_id]);

    return {
      ...post,
      userUpvoted: Boolean(post.upvotes && post.upvotes.length > 0),
      user: post.user_id ? userMap.get(post.user_id) ?? null : null,
    };
  } catch (error) {
    console.error("Error fetching app by ID:", error);
    return null;
  }
};
