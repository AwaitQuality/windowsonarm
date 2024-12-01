import { Card, Title2 } from "@fluentui/react-components";
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

interface ActivityTrendCardProps {
  dailyActivity: Array<{
    date: string;
    count: number;
  }>;
}

export const ActivityTrendCard: React.FC<ActivityTrendCardProps> = ({ dailyActivity }) => {
  return (
    <Card 
      className="p-6 rounded-lg shadow-md" 
      appearance="filled-alternative"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-indigo-500/10 rounded-lg">
          <DataTrendingRegular className="text-indigo-500 text-2xl" />
        </div>
        <Title2>Activity Trend</Title2>
      </div>
      <div className="h-[300px] w-full">
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
                backgroundColor: '#1F2937',
                border: '1px solid #374151',
                borderRadius: '6px',
              }}
              labelStyle={{ color: '#9CA3AF' }}
              labelFormatter={(date) => new Date(date).toLocaleDateString()}
              formatter={(value) => [`${value} updates`, 'Activity']}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#6366F1"
              strokeWidth={2}
              dot={{ fill: '#6366F1', r: 1 }}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}; 