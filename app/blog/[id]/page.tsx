import React from "react";
import { Metadata } from "next";
import { getBlogPostById } from "@/lib/api";
import { Container } from "@/components/ui/container";
import BlogPostContent from "./blog-post-content";
import BlogPostSkeleton from "./blog-post-skeleton";

export const runtime = "edge";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const post = await getBlogPostById(params.id);

  if (!post) {
    return {
      title: "Blog post not found - Windows on ARM",
      description: "Blog post not found",
    };
  }

  return {
    title: `${post.title} - Windows on ARM Blog`,
    description: post.content.slice(0, 160),
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: { id: string };
}) {
  const post = await getBlogPostById(params.id);

  if (!post) return <div>Blog post not found</div>;

  const serializedPost = JSON.parse(JSON.stringify(post));

  return (
    <React.Suspense fallback={<BlogPostSkeleton />}>
      <BlogPostContent post={serializedPost} />
    </React.Suspense>
  );
}
