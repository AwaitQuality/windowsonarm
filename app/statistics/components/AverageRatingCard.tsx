import { Card, Title2, Text, Badge } from "@fluentui/react-components";
import { StarRegular, ArrowTrendingRegular } from "@fluentui/react-icons";

interface AverageRatingCardProps {
  averageRating: number;
  totalReviews: number;
  recentReviews?: {
    averageRating: number;
    totalReviews: number;
  };
}

export const AverageRatingCard: React.FC<AverageRatingCardProps> = ({ 
  averageRating, 
  totalReviews, 
  recentReviews 
}) => {
  return (
    <Card 
      className="p-6 rounded-lg shadow-md" 
      appearance="filled-alternative"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-yellow-500/10 rounded-lg">
          <StarRegular className="text-yellow-500 text-2xl" />
        </div>
        <div>
          <Title2>Average Rating</Title2>
        </div>
      </div>

      <div className="flex items-end gap-4 mb-4">
        <Text size={800} className="text-4xl font-bold text-yellow-400">
          {averageRating.toFixed(1)}
          <span className="text-2xl">/5.0</span>
        </Text>
      </div>

      <div className="flex items-center gap-2 bg-yellow-500/5 rounded-lg p-3">
        <Badge 
          appearance="filled" 
          className="bg-yellow-500 text-white"
          size="large"
        >
          {recentReviews ? `+${recentReviews.totalReviews}` : totalReviews}
        </Badge>
        <Text size={300} className="text-neutral-300">
          {recentReviews 
            ? "new reviews in the last 7 days"
            : "total reviews"
          }
        </Text>
      </div>
    </Card>
  );
}; 