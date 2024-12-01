import { Card, Title2, Text } from "@fluentui/react-components";
import { TimerRegular } from "@fluentui/react-icons";

interface RecentActivityCardProps {
  recentActivity: {
    lastDay: number;
    lastWeek: number;
    lastMonth: number;
  };
}

export const RecentActivityCard: React.FC<RecentActivityCardProps> = ({ recentActivity }) => {
  return (
    <Card 
      className="p-6 rounded-lg shadow-md" 
      appearance="filled-alternative"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-green-500/10 rounded-lg">
          <TimerRegular className="text-green-500 text-2xl" />
        </div>
        <Title2>Recent Activity</Title2>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Text className="text-neutral-400">Last 24 hours</Text>
          <Text className="text-green-400 font-semibold">{recentActivity.lastDay} updates</Text>
        </div>
        <div className="flex items-center justify-between">
          <Text className="text-neutral-400">Last 7 days</Text>
          <Text className="text-green-400 font-semibold">{recentActivity.lastWeek} updates</Text>
        </div>
        <div className="flex items-center justify-between">
          <Text className="text-neutral-400">Last 30 days</Text>
          <Text className="text-green-400 font-semibold">{recentActivity.lastMonth} updates</Text>
        </div>
      </div>
    </Card>
  );
}; 