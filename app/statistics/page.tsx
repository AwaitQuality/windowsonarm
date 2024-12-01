"use client";

import React from "react";
import { useQuery } from "react-query";
import { Title1, Text, ProgressBar } from "@fluentui/react-components";
import Navigation from "@/components/navigation";
import { aqApi } from "@/lib/axios/api";
import { TotalAppsCard } from "./components/TotalAppsCard";
import { AverageRatingCard } from "./components/AverageRatingCard";
import { RecentActivityCard } from "./components/RecentActivityCard";
import { ActivityTrendCard } from "./components/ActivityTrendCard";
import { CategoryDistributionCard } from "./components/CategoryDistributionCard";
import { MostReviewedAppsCard } from "./components/MostReviewedAppsCard";
import { RecentStatusChangesCard } from "./components/RecentStatusChangesCard";
import { StatusDistributionCard } from "./components/StatusDistributionCard";
import { TopTagsCard } from "./components/TopTagsCard";
import { MostUpvotedAppsCard } from "./components/MostUpvotedAppsCard";
import { StatisticsResponse } from "./types";

export default function Statistics() {
  const { data, isLoading, error } = useQuery<StatisticsResponse>(
    ["statistics"],
    async () => {
      const response =
        await aqApi.get<StatisticsResponse>("/api/v1/statistics");
      if (!response.success) {
        throw new Error(response.error);
      }
      return response.data;
    }
  );

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Navigation className="mb-8" />
        <Title1 className="!block mb-6">Statistics</Title1>
        <ProgressBar />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Navigation className="mb-8" />
        <Title1 className="!block mb-6">Statistics</Title1>
        <Text>Error loading statistics.</Text>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <Navigation className="mb-8" />
      <Title1 className="mb-6 !block">Statistics</Title1>

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
        <MostReviewedAppsCard
          mostReviewedApps={data.mostReviewedApps}
          variant="chart"
        />
        <RecentStatusChangesCard
          recentStatusChanges={data.recentStatusChanges}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <StatusDistributionCard appsPerStatus={data.appsPerStatus} />
        <TopTagsCard topTags={data.topTags} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <MostReviewedAppsCard
          mostReviewedApps={data.mostReviewedApps}
          variant="table"
        />
        <MostUpvotedAppsCard upvoteStats={data.upvoteStats} />
        <CategoryDistributionCard appsPerCategory={data.appsPerCategory} />
        <TopTagsCard topTags={data.topTags} />
      </div>
    </div>
  );
}
