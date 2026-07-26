import { NextResponse } from "next/server";
import getPrisma from "@/lib/db/prisma";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PENDING_STATUS_ID } from "@/lib/schemas/post";
import { unstable_cache } from "next/cache";

const BASE_URL = "https://windowsonarm.org";

/**
 * ISO strings, not Date objects. `unstable_cache` serialises its result, so a
 * Date survives the first (uncached) call and comes back as a string on every
 * cache hit — calling .toISOString() on it then throws, which is exactly how
 * this route started returning 500 once the cache was warm.
 */
interface SitemapEntry {
  id: string;
  updated_at: string;
}

// Rendered per request rather than frozen at build time, so posts added since
// the last deploy appear. The database work itself is cached below, so "dynamic"
// costs a Worker invocation, not a table scan.
export const dynamic = "force-dynamic";


function generateSiteMap(
  apps: SitemapEntry[],
  blogPosts: SitemapEntry[]
) {
  return `<?xml version="1.0" encoding="UTF-8"?>
   <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
     <url>
       <loc>${BASE_URL}</loc>
       <priority>1.0</priority>
       <changefreq>daily</changefreq>
       <lastmod>2024-07-18</lastmod>
     </url>
     <url>
      <loc>https://windowsonarm.org/auth/signin</loc>
      <lastmod>2024-07-18</lastmod>
      <changefreq>monthly</changefreq>
      <priority>0.3</priority>
    </url>
    <url>
      <loc>https://windowsonarm.org/auth/signup</loc>
      <lastmod>2024-07-18</lastmod>
      <changefreq>monthly</changefreq>
      <priority>0.3</priority>
    </url>
     ${apps
       .map(({ id, updated_at }) => {
         return `
       <url>
           <loc>${BASE_URL}/${id}</loc>
           <priority>0.8</priority>
            <changefreq>daily</changefreq>
            <lastmod>${updated_at}</lastmod>
       </url>
     `;
       })
       .join("")}
     ${blogPosts
       .map(({ id, updated_at }) => {
         return `
       <url>
           <loc>${BASE_URL}/blog/${id}</loc>
           <priority>0.9</priority>
            <changefreq>weekly</changefreq>
            <lastmod>${updated_at}</lastmod>
       </url>
     `;
       })
       .join("")}
   </urlset>
 `;
}

/**
 * Crawlers request the sitemap far more often than the content changes, and each
 * request scans the whole Post and BlogPost tables. One hour of caching makes
 * that one scan per hour instead of one per crawl.
 */
const getSitemapEntries = unstable_cache(
  async () => {
    const { env } = await getCloudflareContext({ async: true });
    const prisma = getPrisma(env.DB);

    const [apps, blogPosts] = await Promise.all([
      prisma.post.findMany({
        // Same visibility rule as the public listing: pending submissions are
        // deliberately hidden, so they must not be handed to search engines.
        where: { effective_status_id: { not: PENDING_STATUS_ID } },
        select: { id: true, updated_at: true },
      }),
      prisma.blogPost.findMany({
        where: { published: true },
        select: { id: true, updated_at: true },
      }),
    ]);

    const toEntries = (
      rows: { id: string; updated_at: Date }[]
    ): SitemapEntry[] =>
      rows.map(({ id, updated_at }) => ({
        id,
        updated_at: updated_at.toISOString(),
      }));

    return { apps: toEntries(apps), blogPosts: toEntries(blogPosts) };
  },
  ["sitemap-entries"],
  { revalidate: 3600 }
);

export async function GET() {
  try {
    const { apps, blogPosts } = await getSitemapEntries();

    const sitemap = generateSiteMap(apps, blogPosts);

    return new NextResponse(sitemap, {
      status: 200,
      headers: {
        "Content-Type": "text/xml",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error(error);
    return new NextResponse("Error generating sitemap", { status: 500 });
  }
}
