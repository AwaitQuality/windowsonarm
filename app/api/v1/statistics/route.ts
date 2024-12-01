import { NextResponse } from "next/server";
import getPrisma from "@/lib/db/prisma";
import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = "edge";

export async function GET() {
  try {
    const { env } = getRequestContext();
    const prisma = getPrisma(env.DB);

    // Get total apps count
    const totalApps = await prisma.post.count();
    const lastWeekNewApps = await prisma.post.count({
      where: {
        created_at: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    });

    // Get apps per status with percentages
    const statusCounts = await prisma.$queryRaw<
      Array<{
        status: string;
        count: number;
        percentage: number;
        color: string;
      }>
    >`
      SELECT 
        s.name as status,
        s.color as color,
        COUNT(*) as count,
        ROUND(CAST(COUNT(*) AS FLOAT) * 100.0 / ${totalApps}, 1) as percentage
      FROM Post p
      JOIN Status s ON p.status = s.id
      GROUP BY s.name, s.color
      ORDER BY s.idx ASC
    `;

    // Get apps per category with percentages
    const categoryCounts = await prisma.$queryRaw<
      Array<{ category: string; count: number; percentage: number }>
    >`
      SELECT 
        c.name as category,
        COUNT(*) as count,
        ROUND(CAST(COUNT(*) AS FLOAT) * 100.0 / ${totalApps}, 1) as percentage
      FROM Post p
      JOIN Category c ON p.categoryId = c.id
      GROUP BY c.name
      ORDER BY c.idx ASC
    `;

    // Get top tags
    const topTags = await prisma.$queryRaw<
      Array<{ tag: string; count: number }>
    >`
      SELECT 
        t.name as tag,
        COUNT(*) as count
      FROM Tag t
      JOIN _PostToTag pt ON t.id = pt.B
      GROUP BY t.name
      ORDER BY count DESC
      LIMIT 10
    `;

    // Get recent activity
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [lastDay, lastWeek, lastMonth] = await Promise.all([
      prisma.post.count({
        where: {
          updated_at: {
            gte: oneDayAgo,
          },
        },
      }),
      prisma.post.count({
        where: {
          updated_at: {
            gte: oneWeekAgo,
          },
        },
      }),
      prisma.post.count({
        where: {
          updated_at: {
            gte: oneMonthAgo,
          },
        },
      }),
    ]);

    // Get status changes in last 7 days
    const recentStatusChanges = await prisma.$queryRaw<
      Array<{ status: string; count: number; color: string }>
    >`
      SELECT 
        s.name as status,
        s.color as color,
        COUNT(*) as count
      FROM Post p
      JOIN Status s ON p.status = s.id
      WHERE p.updated_at >= ${oneWeekAgo}
      GROUP BY s.name, s.color
      ORDER BY count DESC
    `;

    // Get most active categories (categories with most updates in last 30 days)
    const activeCategories = await prisma.$queryRaw<
      Array<{ category: string; count: number }>
    >`
      SELECT 
        c.name as category,
        COUNT(*) as count
      FROM Post p
      JOIN Category c ON p.categoryId = c.id
      WHERE p.updated_at >= ${oneMonthAgo}
      GROUP BY c.name
      ORDER BY count DESC
      LIMIT 5
    `;

    // Get average rating and total reviews
    const reviewStats = await prisma.$queryRaw<
      Array<{ avg_rating: number; total_reviews: number }>
    >`
      SELECT 
        ROUND(AVG(CAST(rating AS FLOAT)), 1) as avg_rating,
        COUNT(*) as total_reviews
      FROM Review
    `;

    // Get recent review statistics
    const recentReviews = await prisma.$queryRaw<
      Array<{ avg_rating: number; total_reviews: number }>
    >`
      SELECT 
        ROUND(AVG(CAST(rating AS FLOAT)), 1) as avg_rating,
        COUNT(*) as total_reviews
      FROM Review
      WHERE created_at >= ${oneWeekAgo}
    `;

    // Get most reviewed apps
    const mostReviewedApps = await prisma.$queryRaw<
      Array<{ title: string; review_count: number; avg_rating: number }>
    >`
      SELECT 
        p.title,
        COUNT(*) as review_count,
        ROUND(AVG(CAST(r.rating AS FLOAT)), 1) as avg_rating
      FROM Post p
      JOIN Review r ON p.id = r.post_id
      GROUP BY p.title
      ORDER BY review_count DESC
      LIMIT 5
    `;

    // Get upvote statistics
    const upvoteStats = await prisma.$queryRaw<
      Array<{ title: string; upvotes: number }>
    >`
      SELECT 
        p.title,
        COUNT(*) as upvotes
      FROM Post p
      JOIN Upvote u ON p.id = u.post_id
      GROUP BY p.title
      ORDER BY upvotes DESC
      LIMIT 5
    `;

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    // Get daily activity for last 30 days
    const dailyActivity = await prisma.post.groupBy({
      by: ['created_at'],
      _count: {
        id: true
      },
      where: {
        created_at: {
          gte: thirtyDaysAgo
        }
      },
      orderBy: {
        created_at: 'asc'
      }
    });

    // Format daily activity into array of {date, count} objects
    const dailyActivityData = Array.from({ length: 30 }, (_, i) => {
      const date = new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const activity = dailyActivity.find(d => d.created_at.toISOString().startsWith(dateStr));
      return {
        date: dateStr,
        count: activity ? activity._count.id : 0
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        totalApps,
        lastWeekNewApps,
        appsPerStatus: statusCounts,
        appsPerCategory: categoryCounts,
        topTags,
        recentActivity: {
          lastDay,
          lastWeek,
          lastMonth,
        },
        recentStatusChanges,
        activeCategories,
        averageRating: reviewStats[0]?.avg_rating || 0,
        totalReviews: reviewStats[0]?.total_reviews || 0,
        recentReviews: {
          averageRating: recentReviews[0]?.avg_rating || 0,
          totalReviews: recentReviews[0]?.total_reviews || 0,
        },
        mostReviewedApps,
        upvoteStats,
        dailyActivity: dailyActivityData,
      },
    });
  } catch (error) {
    console.error("Error fetching statistics:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch statistics" },
      { status: 500 }
    );
  }
}
