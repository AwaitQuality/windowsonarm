import { Post, Status, Upvote } from "@prisma/client";
import { User } from "@clerk/nextjs/server";

export type FullPost = Post & { statusRel: Status | null } & {
  user: User | null;
} & {
  upvotes?: Upvote[];
} & {
  userUpvoted: boolean;
};
