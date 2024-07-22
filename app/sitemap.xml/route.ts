import { NextResponse } from "next/server";
import getPrisma from "@/lib/db/prisma";
import { getRequestContext } from "@cloudflare/next-on-pages";

const BASE_URL = "https://windowsonarm.org";

export const runtime = "edge";

function generateSiteMap(apps: { id: string; updated_at: Date }[]) {
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
      <priority>0.8</priority>
    </url>
    <url>
      <loc>https://windowsonarm.org/auth/signup</loc>
      <lastmod>2024-07-18</lastmod>
      <changefreq>monthly</changefreq>
      <priority>0.8</priority>
    </url>
     ${apps
       .map(({ id, updated_at }) => {
         return `
       <url>
           <loc>${BASE_URL}/app/${id}</loc>
           <priority>0.8</priority>
            <changefreq>daily</changefreq>
            <lastmod>${updated_at.toISOString()}</lastmod>
       </url>
     `;
       })
       .join("")}
   </urlset>
 `;
}

export async function GET() {
  try {
    const { env } = getRequestContext();

    const prisma = getPrisma(env.DATABASE_URL);

    const apps = await prisma.post.findMany({
      select: { id: true, updated_at: true },
    });

    const sitemap = generateSiteMap(apps);

    return new NextResponse(sitemap, {
      status: 200,
      headers: {
        "Content-Type": "text/xml",
      },
    });
  } catch (error) {
    console.error(error);
    return new NextResponse("Error generating sitemap", { status: 500 });
  }
}
