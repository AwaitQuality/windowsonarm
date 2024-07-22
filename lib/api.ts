import { PrismaClient } from "@prisma/client";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { FullPost } from "@/lib/types/prisma/prisma-types";

const prisma = new PrismaClient();

export async function getAppById(id: string) {
  const userId = auth().userId;

  try {
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        statusRel: true,
        upvotes: userId
          ? {
              where: {
                user_id: userId,
              },
              take: 1,
            }
          : false,
        category: true,
        _count: {
          select: { upvotes: true },
        },
      },
    });

    if (!post) {
      return null;
    }

    let fullPost: FullPost = {
      ...post,
      userUpvoted: post.upvotes?.length > 0,
      user: null,
    };

    if (post.user_id) {
      fullPost.user = await clerkClient().users.getUser(post.user_id);
    }

    return JSON.parse(JSON.stringify(fullPost));
  } catch (error) {
    console.error("Error fetching app by ID:", error);
    return null;
  }
}
