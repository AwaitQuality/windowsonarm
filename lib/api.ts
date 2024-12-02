import { auth, clerkClient } from "@clerk/nextjs/server";
import { FullPost } from "@/lib/types/prisma/prisma-types";
import getPrisma from "@/lib/db/prisma";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { headers } from "next/headers";

export const getAppById = async (
  id: string,
  logView: boolean = true
): Promise<FullPost | null> => {
  const userId = auth().userId;
  const { env } = getRequestContext();
  const prisma = getPrisma(env.DB);

  try {
    // Track view
    const headersList = headers();
    const ip =
      headersList.get("x-forwarded-for") ||
      headersList.get("x-real-ip") ||
      "unknown";

    if (logView) {
      // Create view record if it doesn't exist for this IP and post
      const viewExists = await prisma.view.findFirst({
        where: {
          post_id: id,
          ip_address: ip,
        },
      });

      if (!viewExists) {
        console.log(id);
        try {
          await prisma.view.create({
            data: {
              post_id: id,
              ip_address: ip,
            },
          });
        } catch (error: any) {
          // Type the error as any to access properties
          // Check if it's a Prisma error with code P2002 (unique constraint violation)
          if (error?.code === "P2002") {
            // View already exists, continue silently
          } else {
            throw error; // Re-throw if it's a different error
          }
        }
      }
    }

    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        status: true,
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
      const user = await clerkClient().users.getUserList({
        userId: [post.user_id],
      });

      if (user.data.length > 0) {
        fullPost.user = user.data[0];
      }

      const externalId = await clerkClient().users.getUserList({
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
};

export async function getBlogPostById(id: string) {
  const { env } = getRequestContext();
  const prisma = getPrisma(env.DB);

  const post = await prisma.blogPost.findUnique({
    where: {
      id: id,
    },
  });

  if (!post) return null;

  // Fetch author information from Clerk
  try {
    const user = await clerkClient().users.getUser(post.author_id);
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
