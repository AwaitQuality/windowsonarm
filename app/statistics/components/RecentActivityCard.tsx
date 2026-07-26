import React from "react";
import { Text } from "@fluentui/react-components";
import { TimerRegular } from "@fluentui/react-icons";
import { StatCard } from "./StatCard";
import { ActivityCounts } from "../types";

interface RecentActivityCardProps {
  recentActivity: ActivityCounts;
}

const ROWS: Array<{ label: string; key: keyof ActivityCounts }> = [
  { label: "Last 24 hours", key: "lastDay" },
  { label: "Last 7 days", key: "lastWeek" },
  { label: "Last 30 days", key: "lastMonth" },
];

export const RecentActivityCard: React.FC<RecentActivityCardProps> = ({
  recentActivity,
}) => {
  return (
    <StatCard
      title="Recent Activity"
      iconBackground="bg-green-500/10"
      icon={<TimerRegular className="text-green-500 text-2xl" />}
    >
      <div className="space-y-3">
        {ROWS.map(({ label, key }) => (
          <div key={key} className="flex items-center justify-between">
            <Text className="text-neutral-400">{label}</Text>
            <Text className="text-green-400 font-semibold">
              {recentActivity[key]} updates
            </Text>
          </div>
        ))}
      </div>
    </StatCard>
  );
};
