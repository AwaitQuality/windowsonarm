import React from "react";
import { Text, Badge } from "@fluentui/react-components";
import {
  ArrowTrendingRegular,
  ChartMultipleRegular,
} from "@fluentui/react-icons";
import { StatCard } from "./StatCard";

interface TotalAppsCardProps {
  totalApps: number;
  lastWeekNewApps: number;
}

export const TotalAppsCard: React.FC<TotalAppsCardProps> = ({
  totalApps,
  lastWeekNewApps,
}) => {
  const percentageGrowth =
    totalApps === 0 ? "0.0" : ((lastWeekNewApps / totalApps) * 100).toFixed(1);

  return (
    <StatCard
      title="Total Apps"
      iconBackground="bg-blue-500/10"
      icon={<ChartMultipleRegular className="text-blue-500 text-2xl" />}
    >
      <div className="flex items-end gap-4 mb-4">
        <Text size={800} className="text-4xl font-bold text-blue-400">
          {totalApps.toLocaleString()}
        </Text>
        <div className="flex items-center gap-1 mb-1">
          <ArrowTrendingRegular className="text-green-500" />
          <Text className="text-green-500 font-medium">
            {percentageGrowth}%
          </Text>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-blue-500/5 rounded-lg p-3">
        <Badge
          appearance="filled"
          className="bg-blue-500 text-white"
          size="large"
        >
          +{lastWeekNewApps}
        </Badge>
        <Text size={300} className="text-neutral-300">
          new apps added in the last 7 days
        </Text>
      </div>
    </StatCard>
  );
};
