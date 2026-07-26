import { auth, clerkClient } from "@clerk/nextjs/server";
import { FullPost } from "@/lib/types/prisma/prisma-types";
import getPrisma from "@/lib/db/prisma";
import { lookupClerkUsersByIds } from "@/lib/backend/clerk";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PENDING_STATUS_ID } from "@/lib/schemas/post";
import { headers } from "next/headers";

import { cache } from "react";

/**
 * Keyed digest of a visitor IP. The View table only ever needs to answer "has
 * this visitor already been counted for this post", which a stable hash does
 * just as well as the plaintext -- and an unkeyed hash would not be enough,
 * because the whole IPv4 space is small enough to enumerate.
 */
const hashIp = async (ip: string, secret: string): Promise<string> => {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const mac = await crypto.subtle.sign("HMAC", key, encoder.encode(ip));

  return Array.from(new Uint8Array(mac))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

/**
 * Records one view per visitor per post and bumps the counter.
 *
 * The counter is incremented rather than re-derived with `SELECT COUNT(*)`: the
 * recount scanned every View row for the post on each view, which grows with
 * traffic. The unique index on (post_id, ip_hash) is what keeps the increment
 * honest — a repeat visitor's insert fails, so the batch never applies.
 *
 * Both statements go out as one D1 batch, since D1 has no interactive
 * transactions, and a failed insert therefore rolls the increment back with it.
 */
const recordView = async (
  prisma: ReturnType<typeof getPrisma>,
  postId: string
): Promise<void> => {
  const secret = process.env.VIEW_IP_HASH_SECRET;

  if (!secret) {
    // Fail closed: writing an unkeyed or plaintext value would reintroduce the
    // per-visitor browsing history this hash exists to avoid.
    console.warn(
      "VIEW_IP_HASH_SECRET is not set; skipping view tracking for this request."
    );
    return;
  }

  const headersList = await headers();
  // cf-connecting-ip is set by Cloudflare's edge and cannot be spoofed by the
  // client. x-forwarded-for / x-real-ip are caller-supplied and were trivially
  // rotated to inflate views_count, which drives public ordering.
  const ip = headersList.get("cf-connecting-ip") || "unknown";
  const ip_hash = await hashIp(ip, secret);

  try {
    await prisma.$transaction([
      prisma.view.create({ data: { post_id: postId, ip_hash } }),
      prisma.post.update({
        where: { id: postId },
        data: { views_count: { increment: 1 } },
      }),
    ]);
  } catch (error: unknown) {
    const code: unknown =
      typeof error === "object" && error !== null
        ? Reflect.get(error, "code")
        : undefined;

    // P2002: this visitor is already counted for this post. Expected, not an
    // error, and the counter must not move.
    if (code !== "P2002") {
      console.error("Unexpected error while recording a view:", error);
    }
  }
};

export const getAppById = cache(
  async (
    id: string,
    logView: boolean = true
  ): Promise<FullPost | null> => {
  const { userId } = await auth();
  const { env } = await getCloudflareContext({ async: true });
  const prisma = getPrisma(env.DB);

  try {
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
      },
    });

    if (!post) {
      return null;
    }

    let fullPost: FullPost = {
      ...post,
      // Read from the denormalised counters, not a live `_count`. The listing
      // orders by these columns, so serving live counts here let a post rank
      // above another while displaying a lower number. It also drops two
      // correlated subqueries from every post page.
      _count: { upvotes: post.upvotes_count, views: post.views_count },
      userUpvoted: (post.upvotes?.length ?? 0) > 0,
      user: null,
    };

    // Deliberately after the fetch: recording a view first let a stranger
    // probing a pending id write a View row even though the request 404s.
    if (logView && post.effective_status_id !== PENDING_STATUS_ID) {
      await recordView(prisma, id);
    }

    if (post.user_id) {
      // Plain summary, not Clerk's User class: this object crosses the RSC
      // boundary into client components.
      const users = await lookupClerkUsersByIds([post.user_id]);
      fullPost.user = users.get(post.user_id) ?? null;
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
