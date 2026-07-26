import { unstable_cache } from "next/cache";
import getPrisma from "@/lib/db/prisma";
import { getCloudflareContext } from "@opennextjs/cloudflare";

/** One row per calendar day, bucketed by SQLite rather than in JS. */
interface DailyPostCountRow {
  day: string;
  count: number;
}

export type StatisticsPayload = Awaited<ReturnType<typeof computeStatistics>>;

/** ~13 aggregate queries. Only ever called through `getStatistics`. */
const computeStatistics = async () => {
  const { env } = await getCloudflareContext({ async: true });
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

  // Get daily activity for last 30 days. Grouping on the raw timestamp would
  // return one row per post, so the day bucket is computed in SQL.
  const dailyPosts = await prisma.$queryRaw<DailyPostCountRow[]>`
    SELECT date(created_at) AS day, COUNT(*) AS count
    FROM "Post"
    WHERE created_at >= ${thirtyDaysAgo.toISOString()}
    GROUP BY day
  `;

  const postCountsByDay = new Map(
    dailyPosts.map((row) => [row.day, Number(row.count)]),
  );

  // Create array of all dates in last 30 days
  const dailyActivityData = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split("T")[0];
    return {
      date: dateStr,
      count: postCountsByDay.get(dateStr) ?? 0,
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
        _count: "desc",
      },
    },
    take: 5,
  });

  // Format most viewed apps
  const formattedMostViewedApps = mostViewedApps.map((app) => ({
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
          // Count by the status shown publicly, which the community can decide.
          effective_posts: true,
        },
      },
    },
    orderBy: {
      index: "asc",
    },
  });

  const appsPerStatus = statusCounts.map((status) => ({
    status: status.name,
    color: status.color,
    count: status._count.effective_posts,
    percentage: totalApps
      ? Math.round(((status._count.effective_posts * 100) / totalApps) * 10) /
        10
      : 0,
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
      index: "asc",
    },
  });

  const appsPerCategory = categoryCounts.map((category) => ({
    category: category.name,
    count: category._count.posts,
    percentage: totalApps
      ? Math.round(((category._count.posts * 100) / totalApps) * 10) / 10
      : 0,
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
        _count: "desc",
      },
    },
    take: 10,
  });

  const formattedTopTags = topTags.map((tag) => ({
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

  // Get most reviewed apps. The average is aggregated in the database rather
  // than by pulling every review row back into the worker.
  const reviewAggregates = await prisma.review.groupBy({
    by: ["post_id"],
    _count: {
      _all: true,
    },
    _avg: {
      rating: true,
    },
    orderBy: {
      _count: {
        post_id: "desc",
      },
    },
    take: 5,
  });

  const reviewedPosts = await prisma.post.findMany({
    where: {
      id: { in: reviewAggregates.map((aggregate) => aggregate.post_id) },
    },
    select: {
      id: true,
      title: true,
    },
  });

  const titlesByPostId = new Map(
    reviewedPosts.map((post) => [post.id, post.title]),
  );

  const formattedMostReviewedApps = reviewAggregates.map((aggregate) => ({
    title: titlesByPostId.get(aggregate.post_id) ?? "Unknown app",
    review_count: aggregate._count._all,
    avg_rating: Math.round((aggregate._avg.rating ?? 0) * 10) / 10,
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
        _count: "desc",
      },
    },
    take: 5,
  });

  const formattedUpvoteStats = upvoteStats.map((app) => ({
    title: app.title,
    upvotes: app._count.upvotes,
  }));

  return {
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
      averageRating: Math.round((recentReviewStats._avg.rating || 0) * 10) / 10,
      totalReviews: recentReviewStats._count,
    },
    mostReviewedApps: formattedMostReviewedApps,
    upvoteStats: formattedUpvoteStats,
  };
};

/**
 * The statistics page is read-only and its numbers move slowly, but computing it
 * costs roughly thirteen aggregate queries over the whole Post/Review/Tag set.
 * Five minutes of caching turns that into one computation per window instead of
 * one per visitor. Requires the R2-backed incremental cache configured in
 * open-next.config.ts — with the default "dummy" cache this would be a no-op.
 */
export const getStatistics = unstable_cache(computeStatistics, ["statistics"], {
  revalidate: 300,
});
