import React from "react";
import type { Metadata } from "next";
import StatisticsDashboard from "./components/StatisticsDashboard";
import { getStatistics } from "@/lib/backend/statistics";
import type { StatisticsResponse } from "./types";

/**
 * Rendered per request, not at build time. As a static route Next prerendered it
 * during the build, which meant the build itself needed a populated D1 — it
 * passed locally (a local database exists) and failed in CI with
 * "no such table: main.Post". Baking the numbers at build time would also have
 * frozen them, since the five-minute refresh comes from the cache in
 * lib/backend/statistics.ts rather than from ISR.
 */
export const dynamic = "force-dynamic";

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
