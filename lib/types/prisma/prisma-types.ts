import {
  BlogPost as PrismaBlogPost,
  Category,
  Post,
  Status,
  Tag,
  Upvote,
} from "@/lib/generated/prisma/client";
import type { ClerkUserSummary } from "@/lib/types/clerk";

export type FullPost = Post & { status: Status | null } & {
  /** Community-decided status when it overrides `status`, otherwise mirrors it. */
  effective_status?: Status | null;
} & {
  user: ClerkUserSummary | null;
} & {
  upvotes?: Upvote[];
} & {
  userUpvoted: boolean;
} & {
  tags: Tag[];
} & {
  category: Category;
} & {
  _count: {
    upvotes: number;
    views: number;
  };
};

/**
 * The single source of truth for a blog post: the Prisma row plus the optional
 * Clerk author summary the API resolves for it. Derived from the model so a
 * schema change cannot silently diverge from the client types.
 */
export type BlogPost = PrismaBlogPost & {
  author?: ClerkUserSummary;
};

/**
 * A blog post from an endpoint that always resolves the author (`/api/v1/blog`
 * and `getBlogPostById` both fall back to an "Anonymous" author).
 */
export type BlogPostWithAuthor = PrismaBlogPost & {
  author: ClerkUserSummary;
};
