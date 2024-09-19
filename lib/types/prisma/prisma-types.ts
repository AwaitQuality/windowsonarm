import { Category, Post, Status, Tag, Upvote } from "@prisma/client";
import { User } from "@clerk/nextjs/server";

export type FullPost = Post & { status: Status | null } & {
  user: User | null;
} & {
  upvotes?: Upvote[];
} & {
  userUpvoted: boolean;
} & {
  tags: Tag[];
} & {
  category: Category;
};
