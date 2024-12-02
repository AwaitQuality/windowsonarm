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
} & {
  _count: {
    upvotes: number;
    views: number;
  };
};

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  image_url?: string | null;
  published: boolean;
  author_id: string;
  created_at: Date;
  updated_at: Date;
  author?: {
    username?: string;
    imageUrl?: string;
  };
}
