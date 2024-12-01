import { Card, Title2 } from "@fluentui/react-components";
import { PersonRegular } from "@fluentui/react-icons";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

interface CategoryDistributionCardProps {
  appsPerCategory: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
}

export const CategoryDistributionCard: React.FC<
  CategoryDistributionCardProps
> = ({ appsPerCategory }) => {
  return (
    <Card className="p-6 rounded-lg shadow-md" appearance="filled-alternative">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-orange-500/10 rounded-lg">
          <PersonRegular className="text-orange-500 text-2xl" />
        </div>
        <Title2>Category Distribution</Title2>
      </div>
      <div className="h-[300px] w-full">
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
                `${name} ${(percent * 100).toFixed(0)}%`
              }
              labelLine={true}
            >
              {appsPerCategory.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
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
                `${value} apps (${(((value as number) / appsPerCategory.reduce((acc, curr) => acc + curr.count, 0)) * 100).toFixed(1)}%)`,
                name,
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
