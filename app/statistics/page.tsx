import React from "react";
import type { Metadata } from "next";
import StatisticsDashboard from "./components/StatisticsDashboard";

export const metadata: Metadata = {
  title: "Statistics - Windows on ARM",
  description:
    "Community statistics for the Windows on ARM software compatibility list: app counts, status and category breakdowns, ratings and recent activity.",
  alternates: { canonical: "/statistics" },
};

export default function Statistics() {
  return <StatisticsDashboard />;
}
