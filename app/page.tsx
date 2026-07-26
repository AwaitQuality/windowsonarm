import React from "react";
import { auth } from "@clerk/nextjs/server";
import HomeView from "@/app/home-view";
import { getInfo } from "@/lib/backend/info";
import { listPosts } from "@/lib/backend/posts";
import { listPublishedBlogPosts } from "@/lib/backend/blog";

/**
 * Server shell for the homepage.
 *
 * The listing, the filter metadata and the blog strip are all fetched here and
 * handed to the client as initial query data. Previously the browser requested
 * /api/v1/info, /api/v1/posts and /api/v1/blog immediately after the HTML
 * arrived — three extra Worker invocations and three extra sets of D1 queries
 * per visit, for data the server had already loaded to render the page.
 *
 * Only the unfiltered first page is prefetched. A filtered URL is a different
 * react-query key, so the client fetches that itself.
 */
export default async function HomePage() {
  const { userId } = await auth();

  const [info, posts, blogPosts] = await Promise.all([
    getInfo(),
    listPosts({ userId }),
    listPublishedBlogPosts(),
  ]);

  return (
    <HomeView
      initialInfo={info}
      initialPosts={posts}
      initialBlogPosts={blogPosts}
    />
  );
}
