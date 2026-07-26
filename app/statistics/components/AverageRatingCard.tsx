import React from "react";
import { Text, Badge } from "@fluentui/react-components";
import { StarRegular } from "@fluentui/react-icons";
import { StatCard } from "./StatCard";
import { ReviewSummary } from "../types";

interface AverageRatingCardProps {
  averageRating: number;
  totalReviews: number;
  recentReviews?: ReviewSummary;
}

export const AverageRatingCard: React.FC<AverageRatingCardProps> = ({
  averageRating,
  totalReviews,
  recentReviews,
}) => {
  return (
    <StatCard
      title="Average Rating"
      iconBackground="bg-yellow-500/10"
      icon={<StarRegular className="text-yellow-500 text-2xl" />}
    >
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
            : "total reviews"}
        </Text>
      </div>
    </StatCard>
  );
};
