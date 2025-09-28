import { NextResponse } from "next/server";
import ErrorResponse from "@/lib/backend/response/ErrorResponse";
import getPrisma from "@/lib/db/prisma";
import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = "edge";

export async function GET() {
  try {
    const { env } = getRequestContext();
    const prisma = getPrisma(env.DB);

    // Get total apps count and last week's new apps
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [totalApps, lastWeekNewApps] = await Promise.all([
      prisma.post.count(),
      prisma.post.count({
        where: {
          created_at: {
            gte: oneWeekAgo,
          },
        },
      }),
    ]);

    // Get daily activity for last 30 days
    const dailyPosts = await prisma.post.groupBy({
      by: ['created_at'],
      _count: {
        id: true,
      },
      where: {
        created_at: {
          gte: thirtyDaysAgo,
        },
      },
    });

    // Create array of all dates in last 30 days
    const dailyActivityData = Array.from({ length: 30 }, (_, i) => {
      const date = new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const postsOnDay = dailyPosts.filter(p => 
        p.created_at.toISOString().split('T')[0] === dateStr
      );
      return {
        date: dateStr,
        count: postsOnDay.reduce((sum, p) => sum + p._count.id, 0),
      };
    });

    // Get most viewed apps using Prisma's aggregation
    const mostViewedApps = await prisma.post.findMany({
      select: {
        title: true,
        _count: {
          select: {
            views: true,
          },
        },
      },
      orderBy: {
        views: {
          _count: 'desc',
        },
      },
      take: 5,
    });

    // Format most viewed apps
    const formattedMostViewedApps = mostViewedApps.map(app => ({
      title: app.title,
      view_count: app._count.views,
    }));

    // Get recent activity counts
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
            gte: thirtyDaysAgo,
          },
        },
      }),
    ]);

    // Get apps per status with percentages
    const statusCounts = await prisma.status.findMany({
      select: {
        name: true,
        color: true,
        _count: {
          select: {
            posts: true,
          },
        },
      },
      orderBy: {
        index: 'asc',
      },
    });

    const appsPerStatus = statusCounts.map(status => ({
      status: status.name,
      color: status.color,
      count: status._count.posts,
      percentage: totalApps ? Math.round((status._count.posts * 100) / totalApps * 10) / 10 : 0,
    }));

    // Get apps per category with percentages
    const categoryCounts = await prisma.category.findMany({
      select: {
        name: true,
        _count: {
          select: {
            posts: true,
          },
        },
      },
      orderBy: {
        index: 'asc',
      },
    });

    const appsPerCategory = categoryCounts.map(category => ({
      category: category.name,
      count: category._count.posts,
      percentage: totalApps ? Math.round((category._count.posts * 100) / totalApps * 10) / 10 : 0,
    }));

    // Get top tags
    const topTags = await prisma.tag.findMany({
      select: {
        name: true,
        _count: {
          select: {
            posts: true,
          },
        },
      },
      orderBy: {
        posts: {
          _count: 'desc',
        },
      },
      take: 10,
    });

    const formattedTopTags = topTags.map(tag => ({
      tag: tag.name,
      count: tag._count.posts,
    }));

    // Get review statistics
    const reviewStats = await prisma.review.aggregate({
      _avg: {
        rating: true,
      },
      _count: true,
    });

    // Get recent review statistics
    const recentReviewStats = await prisma.review.aggregate({
      where: {
        created_at: {
          gte: oneWeekAgo,
        },
      },
      _avg: {
        rating: true,
      },
      _count: true,
    });

    // Get most reviewed apps
    const mostReviewedApps = await prisma.post.findMany({
      select: {
        title: true,
        reviews: {
          select: {
            rating: true,
          },
        },
        _count: {
          select: {
            reviews: true,
          },
        },
      },
      orderBy: {
        reviews: {
          _count: 'desc',
        },
      },
      take: 5,
    });

    const formattedMostReviewedApps = mostReviewedApps.map(app => ({
      title: app.title,
      review_count: app._count.reviews,
      avg_rating: app.reviews.length > 0
        ? Math.round(app.reviews.reduce((sum, r) => sum + r.rating, 0) / app.reviews.length * 10) / 10
        : 0,
    }));

    // Get upvote statistics
    const upvoteStats = await prisma.post.findMany({
      select: {
        title: true,
        _count: {
          select: {
            upvotes: true,
          },
        },
      },
      orderBy: {
        upvotes: {
          _count: 'desc',
        },
      },
      take: 5,
    });

    const formattedUpvoteStats = upvoteStats.map(app => ({
      title: app.title,
      upvotes: app._count.upvotes,
    }));

    const response = NextResponse.json({
      success: true,
      data: {
        totalApps,
        lastWeekNewApps,
        dailyActivity: dailyActivityData,
        mostViewedApps: formattedMostViewedApps,
        recentActivity: {
          lastDay,
          lastWeek,
          lastMonth,
        },
        appsPerStatus,
        appsPerCategory,
        topTags: formattedTopTags,
        averageRating: Math.round((reviewStats._avg.rating || 0) * 10) / 10,
        totalReviews: reviewStats._count,
        recentReviews: {
          averageRating:
            Math.round((recentReviewStats._avg.rating || 0) * 10) / 10,
          totalReviews: recentReviewStats._count,
        },
        mostReviewedApps: formattedMostReviewedApps,
        upvoteStats: formattedUpvoteStats,
      },
    });

    response.headers.set("Cache-Control", "s-maxage=300, stale-while-revalidate");

    return response;
  } catch (error) {
    console.error("Error fetching statistics:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch statistics" },
      { status: 500 }
    );
  }
}
