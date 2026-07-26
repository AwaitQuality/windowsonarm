import { auth, clerkClient } from "@clerk/nextjs/server";
import { FullPost } from "@/lib/types/prisma/prisma-types";
import getPrisma from "@/lib/db/prisma";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { headers } from "next/headers";

import { cache } from "react";

export const getAppById = cache(
  async (
    id: string,
    logView: boolean = true
  ): Promise<FullPost | null> => {
  const { userId } = await auth();
  const { env } = await getCloudflareContext({ async: true });
  const prisma = getPrisma(env.DB);

  try {
    // Track view
    const headersList = await headers();
    const ip =
      headersList.get("x-forwarded-for") ||
      headersList.get("x-real-ip") ||
      "unknown";

    if (logView) {
      try {
        // 1. First, attempt to create the unique view record.
        // This will throw an error if the ip_address has already viewed this post_id.
        await prisma.view.create({
          data: {
            post_id: id,
            ip_address: ip, // The viewer's IP address
          },
        });

        // 2. If the above line does NOT throw an error, it means the view was unique.
        // Now, we can safely increment our fast counter.
        await prisma.post.update({
          where: { id: id },
          data: {
            views_count: {
              increment: 1,
            },
          },
        });
      } catch (e: any) {
        // 3. If an error occurs, check if it's the expected "unique constraint violation" error.
        if (e?.code === "P2002") {
          // This is a duplicate view. It's expected behavior, not an actual error.
          // We simply do nothing, because the view is not unique and the counter should not be incremented.
        } else {
          // It was some other, unexpected database error.
          // You should log this for debugging.
          console.error(
            "An unexpected error occurred while recording a view:",
            e
          );
        }
      }
    }

    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        status: true,
        effective_status: true,
        tags: true,
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
          select: {
            upvotes: true,
            views: true, // Include view count
          },
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
      const user = await (await clerkClient()).users.getUserList({
        userId: [post.user_id],
      });

      if (user.data.length > 0) {
        fullPost.user = user.data[0];
      }

      const externalId = await (await clerkClient()).users.getUserList({
        externalId: [post.user_id],
      });

      if (externalId.data.length > 0) {
        fullPost.user = externalId.data[0];
      }
    }

    return fullPost;
  } catch (error) {
    console.error("Error fetching app by ID:", error);
    return null;
  }
});

export async function getBlogPostById(id: string) {
  const { env } = await getCloudflareContext({ async: true });
  const prisma = getPrisma(env.DB);

  const post = await prisma.blogPost.findUnique({
    where: {
      id: id,
    },
  });

  if (!post) return null;

  // Fetch author information from Clerk
  try {
    const user = await (await clerkClient()).users.getUser(post.author_id);
    return {
      ...post,
      author: {
        username: user.username || `${user.firstName} ${user.lastName}`.trim(),
        imageUrl: user.imageUrl,
      },
    };
  } catch (error) {
    // Return post with anonymous author if user fetch fails
    return {
      ...post,
      author: {
        username: "Anonymous",
        imageUrl: undefined,
      },
    };
  }
}
