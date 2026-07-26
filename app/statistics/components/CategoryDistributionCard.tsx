import React from "react";
import { PersonRegular } from "@fluentui/react-icons";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { StatCard, ChartFrame } from "./StatCard";
import { CategoryDistribution } from "../types";

interface CategoryDistributionCardProps {
  appsPerCategory: CategoryDistribution[];
}

export const CategoryDistributionCard: React.FC<
  CategoryDistributionCardProps
> = ({ appsPerCategory }) => {
  const totalApps = appsPerCategory.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <StatCard
      title="Category Distribution"
      iconBackground="bg-orange-500/10"
      icon={<PersonRegular className="text-orange-500 text-2xl" />}
    >
      <ChartFrame>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={appsPerCategory}
              dataKey="count"
              nameKey="category"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={({ name, percent }) =>
                `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
              }
              labelLine={true}
            >
              {appsPerCategory.map((entry, index) => (
                <Cell
                  key={entry.category}
                  fill={`hsl(${index * (360 / appsPerCategory.length)}, 70%, 50%)`}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#1F2937",
                border: "1px solid #374151",
                borderRadius: "6px",
              }}
              labelStyle={{ color: "#9CA3AF" }}
              itemStyle={{ color: "#9CA3AF" }}
              formatter={(value, name) => [
                `${value} apps (${totalApps === 0 ? "0.0" : (((value as number) / totalApps) * 100).toFixed(1)}%)`,
                name,
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
      </ChartFrame>
    </StatCard>
  );
};

export default CategoryDistributionCard;
