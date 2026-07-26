import React, { useState } from "react";
import { Text, Button } from "@fluentui/react-components";
import dynamic from "next/dynamic";
import { BlogCard } from "@/components/blog/blog-card";
import { ChevronDownRegular, ChevronUpRegular } from "@fluentui/react-icons";
import { BlogCardSkeleton } from "./blog-card-skeleton";

/**
 * Admin-only editor: react-hook-form, zod, the markdown renderer and the file
 * uploader only ever load for the handful of users who can actually post.
 */
const CreateBlogPost = dynamic(
  () =>
    import("@/components/blog/create-blog-post").then((m) => m.CreateBlogPost),
  { ssr: false },
);

interface BlogPost {
  id: string;
  title: string;
  content: string;
  image_url?: string | null;
  published: boolean;
  author_id: string;
  created_at: Date;
  updated_at: Date;
  author: {
    username?: string;
    imageUrl?: string;
  };
}

interface BlogSectionProps {
  posts: BlogPost[];
  isAdmin: boolean;
  isLoading: boolean;
}

export const BlogSection: React.FC<BlogSectionProps> = ({
  posts,
  isAdmin,
  isLoading,
}) => {
  const [expanded, setExpanded] = useState(false);
  const postsPerRow = 3;
  const visiblePosts = expanded ? posts : posts.slice(0, postsPerRow);
  const hasMorePosts = posts.length > postsPerRow;

  if (isLoading) {
    return (
      <>
        {/* First Wave Line */}
        <div className="w-full my-4">
          <svg
            className="w-full"
            height="32"
            viewBox="0 0 1440 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0 2 C60 2, 60 32, 120 32 C180 32, 180 2, 240 2 C300 2, 300 32, 360 32 C420 32, 420 2, 480 2 C540 2, 540 32, 600 32 C660 32, 660 2, 720 2 C780 2, 780 32, 840 32 C900 32, 900 2, 960 2 C1020 2, 1020 32, 1080 32 C1140 32, 1140 2, 1200 2 C1260 2, 1260 32, 1320 32 C1380 32, 1380 2, 1440 2"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-neutral-300/20 dark:text-neutral-600/30"
              fill="none"
            />
          </svg>
        </div>

        {/* Blog Section */}
        <div className="w-full my-4">
          <div className="flex justify-between items-center mb-6">
            <div className="h-8 bg-neutral-100 dark:bg-neutral-800 animate-pulse rounded w-48" />
          </div>
          <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <BlogCardSkeleton key={i} />
            ))}
          </div>
        </div>

        {/* Second Wave Line */}
        <div className="w-full my-4">
          <svg
            className="w-full"
            height="32"
            viewBox="0 0 1440 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0 32 C60 32, 60 2, 120 2 C180 2, 180 32, 240 32 C300 32, 300 2, 360 2 C420 2, 420 32, 480 32 C540 32, 540 2, 600 2 C660 2, 660 32, 720 32 C780 32, 780 2, 840 2 C900 2, 900 32, 960 32 C1020 32, 1020 2, 1080 2 C1140 2, 1140 32, 1200 32 C1260 32, 1260 2, 1320 2 C1380 2, 1380 32, 1440 32"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-neutral-300/20 dark:text-neutral-600/30"
              fill="none"
            />
          </svg>
        </div>
      </>
    );
  }

  return (
    <>
      {/* First Wave Line */}
      <div className="w-full my-4">
        <svg
          className="w-full"
          height="32"
          viewBox="0 0 1440 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0 2 C60 2, 60 32, 120 32 C180 32, 180 2, 240 2 C300 2, 300 32, 360 32 C420 32, 420 2, 480 2 C540 2, 540 32, 600 32 C660 32, 660 2, 720 2 C780 2, 780 32, 840 32 C900 32, 900 2, 960 2 C1020 2, 1020 32, 1080 32 C1140 32, 1140 2, 1200 2 C1260 2, 1260 32, 1320 32 C1380 32, 1380 2, 1440 2"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-neutral-300/20 dark:text-neutral-600/30"
            fill="none"
          />
        </svg>
      </div>

      {/* Blog Section */}
      <div className="w-full my-4">
        <div className="flex justify-between items-center mb-6">
          <Text size={600} weight="semibold">
            Latest News
          </Text>
          {isAdmin && <CreateBlogPost />}
        </div>
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visiblePosts.map((post) => (
            <BlogCard
              key={post.id}
              post={{
                ...post,
                image_url: post.image_url || undefined,
              }}
            />
          ))}
        </div>

        {hasMorePosts && (
          <div className="flex justify-center mt-6">
            <Button
              appearance="subtle"
              icon={expanded ? <ChevronUpRegular /> : <ChevronDownRegular />}
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? "Show Less" : "View More Updates"}
            </Button>
          </div>
        )}
      </div>

      {/* Second Wave Line */}
      <div className="w-full my-4">
        <svg
          className="w-full"
          height="32"
          viewBox="0 0 1440 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0 32 C60 32, 60 2, 120 2 C180 2, 180 32, 240 32 C300 32, 300 2, 360 2 C420 2, 420 32, 480 32 C540 32, 540 2, 600 2 C660 2, 660 32, 720 32 C780 32, 780 2, 840 2 C900 2, 900 32, 960 32 C1020 32, 1020 2, 1080 2 C1140 2, 1140 32, 1200 32 C1260 32, 1260 2, 1320 2 C1380 2, 1380 32, 1440 32"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-neutral-300/20 dark:text-neutral-600/30"
            fill="none"
          />
        </svg>
      </div>
    </>
  );
};
