import React from "react";
import type { Metadata } from "next";
import StatisticsDashboard from "./components/StatisticsDashboard";
import { getStatistics } from "@/lib/backend/statistics";
import type { StatisticsResponse } from "./types";

export const metadata: Metadata = {
  title: "Statistics - Windows on ARM",
  description:
    "Community statistics for the Windows on ARM software compatibility list: app counts, status and category breakdowns, ratings and recent activity.",
  alternates: { canonical: "/statistics" },
};

export default async function Statistics() {
  // Cached for five minutes in lib/backend/statistics.ts, so this costs one
  // computation per window rather than one per visitor — and the browser no
  // longer requests /api/v1/statistics after the HTML arrives.
  const statistics = (await getStatistics()) as StatisticsResponse;

  return <StatisticsDashboard initialStatistics={statistics} />;
}
