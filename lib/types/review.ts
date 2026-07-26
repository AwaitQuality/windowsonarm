import type { Review as PrismaReview } from "@/lib/generated/prisma/client";
import type { ClerkUserSummary } from "@/lib/types/clerk";

/**
 * A review as it travels over the wire.
 *
 * Identical to the Prisma `Review` row except the `DateTime` columns arrive as
 * ISO strings — `DataResponse` JSON-encodes them — so the client never sees a
 * `Date`. Server code that builds this payload should use the same type so the
 * two sides cannot drift.
 */
export type Review = Omit<PrismaReview, "created_at" | "updated_at"> & {
  created_at: string;
  updated_at: string;
  /** Resolved from Clerk by the GET handler; absent if the lookup missed. */
  user?: ClerkUserSummary;
};
