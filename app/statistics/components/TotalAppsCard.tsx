import { Card, Title2, Text, Badge } from "@fluentui/react-components";
import { ArrowTrendingRegular, ChartMultipleRegular } from "@fluentui/react-icons";

interface TotalAppsCardProps {
  totalApps: number;
  lastWeekNewApps: number;
}

export const TotalAppsCard: React.FC<TotalAppsCardProps> = ({ totalApps, lastWeekNewApps }) => {
  const percentageGrowth = ((lastWeekNewApps / totalApps) * 100).toFixed(1);

  return (
    <Card 
      className="p-6 rounded-lg shadow-md" 
      appearance="filled-alternative"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-blue-500/10 rounded-lg">
          <ChartMultipleRegular className="text-blue-500 text-2xl" />
        </div>
        <div>
          <Title2>Total Apps</Title2>
        </div>
      </div>

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
    </Card>
  );
}; 