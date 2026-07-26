import React from "react";
import { StarRegular } from "@fluentui/react-icons";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { StatCard, ChartFrame } from "./StatCard";
import { MostReviewedApp } from "../types";

interface MostReviewedAppsChartCardProps {
  mostReviewedApps: MostReviewedApp[];
}

export const MostReviewedAppsChartCard: React.FC<
  MostReviewedAppsChartCardProps
> = ({ mostReviewedApps }) => {
  return (
    <StatCard
      title="Most Reviewed Apps"
      icon={<StarRegular className="text-yellow-500 text-2xl" />}
    >
      <ChartFrame>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={mostReviewedApps}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            layout="vertical"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis type="number" stroke="#9CA3AF" />
            <YAxis
              type="category"
              dataKey="title"
              stroke="#9CA3AF"
              width={150}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1F2937",
                border: "1px solid #374151",
                borderRadius: "6px",
              }}
              labelStyle={{ color: "#9CA3AF" }}
            />
            <Bar dataKey="review_count" fill="#EAB308" radius={[0, 4, 4, 0]}>
              {mostReviewedApps.map((entry, index) => (
                <Cell
                  key={entry.title}
                  fill={`hsl(48, ${90 - index * 10}%, 50%)`}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartFrame>
    </StatCard>
  );
};

export default MostReviewedAppsChartCard;
