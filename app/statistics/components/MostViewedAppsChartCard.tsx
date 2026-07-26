import React from "react";
import { EyeRegular } from "@fluentui/react-icons";
import {
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";
import { StatCard, ChartFrame } from "./StatCard";
import { MostViewedApp } from "../types";

interface MostViewedAppsChartCardProps {
  mostViewedApps: MostViewedApp[];
}

export function MostViewedAppsChartCard({
  mostViewedApps,
}: MostViewedAppsChartCardProps) {
  return (
    <StatCard title="Most Viewed Apps" icon={<EyeRegular />}>
      <ChartFrame>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={mostViewedApps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="title"
              angle={-45}
              textAnchor="end"
              height={100}
              interval={0}
            />
            <YAxis />
            <Tooltip />
            <Bar dataKey="view_count" fill="#0078D4" name="Views" />
          </BarChart>
        </ResponsiveContainer>
      </ChartFrame>
    </StatCard>
  );
}

export default MostViewedAppsChartCard;
