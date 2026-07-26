import { NextRequest } from "next/server";
import { z } from "zod";
import { Post } from "@/lib/generated/prisma/client";
import ErrorResponse from "@/lib/backend/response/ErrorResponse";
import DataResponse from "@/lib/backend/response/DataResponse";
import getPrisma from "@/lib/db/prisma";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { auth } from "@clerk/nextjs/server";
import { handleRouteError } from "@/lib/backend/errors";

const upvoteRequestSchema = z.object({
  postId: z.string().min(1),
});

export type UpvoteRequest = z.infer<typeof upvoteRequestSchema>;

export interface UpvoteResponse {
  action: "voted" | "unvoted";
  post: Post;
}

/**
 * Derives `upvotes_count` from the rows that actually exist rather than nudging
 * it by one. Two concurrent toggles can otherwise both read "not upvoted" and
 * both increment, and the counter drives public ordering. Recomputing is also
 * self-healing: a counter that has already drifted is corrected on the next
 * toggle.
 */
const recountUpvotes = (prisma: ReturnType<typeof getPrisma>, postId: string) =>
  prisma.$executeRaw`
    UPDATE "Post"
    SET "upvotes_count" = (
      SELECT COUNT(*) FROM "Upvote" WHERE "Upvote"."post_id" = ${postId}
    )
    WHERE "Post"."id" = ${postId}
  `;

export async function POST(request: NextRequest) {
  try {
    const { postId } = upvoteRequestSchema.parse(await request.json());

    const { userId } = await auth();

    if (!userId) {
      return ErrorResponse.json("Authentication required", { status: 401 });
    }

    const { env } = await getCloudflareContext({ async: true });

    const prisma = getPrisma(env.DB);

    const post = await prisma.post.findUnique({ where: { id: postId } });

    if (!post) {
      return ErrorResponse.json("Post not found", { status: 404 });
    }

    const existing = await prisma.upvote.findUnique({
      where: { post_id_user_id: { post_id: postId, user_id: userId } },
      select: { id: true },
    });

    const action: UpvoteResponse["action"] = existing ? "unvoted" : "voted";

    try {
      // D1 has no interactive transactions, so the write and the counter update
      // go out as a single batch.
      if (existing) {
        await prisma.$transaction([
          // deleteMany, not delete: a concurrent request may already have
          // removed the row, and deleteMany reports 0 instead of throwing.
          prisma.upvote.deleteMany({
            where: { post_id: postId, user_id: userId },
          }),
          recountUpvotes(prisma, postId),
        ]);
      } else {
        await prisma.$transaction([
          // upsert, not create: the unique constraint makes a lost race a
          // no-op instead of a duplicate row.
          prisma.upvote.upsert({
            where: { post_id_user_id: { post_id: postId, user_id: userId } },
            create: { post_id: postId, user_id: userId },
            update: {},
          }),
          recountUpvotes(prisma, postId),
        ]);
      }
    } catch (error: unknown) {
      // P2002 (row already there) and P2025 (row already gone) both mean a
      // concurrent request landed the same toggle first, so the desired state
      // holds either way. Anything else is a real failure.
      const code: unknown =
        typeof error === "object" && error !== null
          ? Reflect.get(error, "code")
          : undefined;

      if (code !== "P2002" && code !== "P2025") {
        throw error;
      }

      // Re-derive the counter, which the aborted batch may have skipped.
      await recountUpvotes(prisma, postId);
    }

    const updated = await prisma.post.findUnique({ where: { id: postId } });

    const response: UpvoteResponse = { action, post: updated ?? post };

    return DataResponse.json(response);
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}
