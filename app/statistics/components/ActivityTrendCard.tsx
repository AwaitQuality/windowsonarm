import React from "react";
import { DataTrendingRegular } from "@fluentui/react-icons";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { StatCard, ChartFrame } from "./StatCard";
import { DailyActivity } from "../types";

interface ActivityTrendCardProps {
  dailyActivity: DailyActivity[];
}

export const ActivityTrendCard: React.FC<ActivityTrendCardProps> = ({
  dailyActivity,
}) => {
  return (
    <StatCard
      title="Activity Trend"
      iconBackground="bg-indigo-500/10"
      icon={<DataTrendingRegular className="text-indigo-500 text-2xl" />}
    >
      <ChartFrame>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={dailyActivity}
            margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="date"
              stroke="#9CA3AF"
              angle={-45}
              textAnchor="end"
              height={60}
              interval={6}
              tickFormatter={(date) => new Date(date).toLocaleDateString()}
            />
            <YAxis stroke="#9CA3AF" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1F2937",
                border: "1px solid #374151",
                borderRadius: "6px",
              }}
              labelStyle={{ color: "#9CA3AF" }}
              labelFormatter={(date) => new Date(date).toLocaleDateString()}
              formatter={(value) => [`${value} updates`, "Activity"]}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#6366F1"
              strokeWidth={2}
              dot={{ fill: "#6366F1", r: 1 }}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartFrame>
    </StatCard>
  );
};

export default ActivityTrendCard;
