"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { Title1, Text, ProgressBar } from "@fluentui/react-components";
import Navigation from "@/components/navigation";
import { aqApi } from "@/lib/http/client";
import { TotalAppsCard } from "./TotalAppsCard";
import { AverageRatingCard } from "./AverageRatingCard";
import { RecentActivityCard } from "./RecentActivityCard";
import { MostReviewedAppsCard } from "./MostReviewedAppsCard";
import { StatusDistributionCard } from "./StatusDistributionCard";
import { TopTagsCard } from "./TopTagsCard";
import { MostUpvotedAppsCard } from "./MostUpvotedAppsCard";
import { MostViewedAppsCard } from "./MostViewedAppsCard";
import { ChartCardSkeleton } from "./StatCard";
import { StatisticsResponse } from "../types";

/**
 * recharts is the single largest dependency on this page and every chart needs
 * `window` for its responsive container, so the four chart cards are fetched
 * client-side only. They all sit below the fold, so the placeholders are never
 * the first thing a visitor sees.
 */
const ActivityTrendCard = dynamic(() => import("./ActivityTrendCard"), {
  ssr: false,
  loading: () => <ChartCardSkeleton title="Activity Trend" />,
});

const CategoryDistributionCard = dynamic(
  () => import("./CategoryDistributionCard"),
  {
    ssr: false,
    loading: () => <ChartCardSkeleton title="Category Distribution" />,
  },
);

const MostReviewedAppsChartCard = dynamic(
  () => import("./MostReviewedAppsChartCard"),
  {
    ssr: false,
    loading: () => <ChartCardSkeleton title="Most Reviewed Apps" />,
  },
);

const MostViewedAppsChartCard = dynamic(
  () => import("./MostViewedAppsChartCard"),
  {
    ssr: false,
    loading: () => <ChartCardSkeleton title="Most Viewed Apps" />,
  },
);

/** Matches the `s-maxage=300` the statistics endpoint serves. */
const CACHE_MS = 1000 * 60 * 5;

function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="container mx-auto px-4 py-8">
      <Navigation className="mb-8" />
      <Title1 className="!block mb-6">Statistics</Title1>
      {children}
    </div>
  );
}

export default function StatisticsDashboard() {
  const { data, isPending, error } = useQuery({
    queryKey: ["statistics"],
    queryFn: async () => {
      const response =
        await aqApi.get<StatisticsResponse>("/api/v1/statistics");
      if (!response.success) {
        throw new Error(response.error);
      }
      return response.data;
    },
    refetchOnWindowFocus: false,
    gcTime: CACHE_MS,
    staleTime: CACHE_MS,
  });

  if (isPending) {
    return (
      <DashboardShell>
        <ProgressBar />
      </DashboardShell>
    );
  }

  if (error) {
    return (
      <DashboardShell>
        <Text>Error loading statistics.</Text>
      </DashboardShell>
    );
  }

  if (!data) return null;

  return (
    <DashboardShell>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
        <TotalAppsCard
          totalApps={data.totalApps}
          lastWeekNewApps={data.lastWeekNewApps}
        />
        <AverageRatingCard
          averageRating={data.averageRating}
          totalReviews={data.totalReviews}
          recentReviews={data.recentReviews}
        />
        <RecentActivityCard recentActivity={data.recentActivity} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <ActivityTrendCard dailyActivity={data.dailyActivity} />
        <CategoryDistributionCard appsPerCategory={data.appsPerCategory} />
        <MostReviewedAppsChartCard mostReviewedApps={data.mostReviewedApps} />
        <MostViewedAppsChartCard mostViewedApps={data.mostViewedApps} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <StatusDistributionCard appsPerStatus={data.appsPerStatus} />
        <TopTagsCard topTags={data.topTags} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <MostReviewedAppsCard mostReviewedApps={data.mostReviewedApps} />
        <MostViewedAppsCard mostViewedApps={data.mostViewedApps} />
        <MostUpvotedAppsCard upvoteStats={data.upvoteStats} />
      </div>
    </DashboardShell>
  );
}
