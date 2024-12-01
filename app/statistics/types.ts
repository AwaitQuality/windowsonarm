export interface StatisticsResponse {
  totalApps: number;
  lastWeekNewApps: number;
  appsPerStatus: Array<{
    status: string;
    count: number;
    percentage: number;
    color: string;
  }>;
  appsPerCategory: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
  topTags: Array<{
    tag: string;
    count: number;
  }>;
  recentActivity: {
    lastDay: number;
    lastWeek: number;
    lastMonth: number;
  };
  averageRating: number;
  totalReviews: number;
  recentReviews: {
    averageRating: number;
    totalReviews: number;
  };
  mostReviewedApps: Array<{
    title: string;
    review_count: number;
    avg_rating: number;
  }>;
  upvoteStats: Array<{
    title: string;
    upvotes: number;
  }>;
  dailyActivity: Array<{
    date: string;
    count: number;
  }>;
  mostViewedApps: Array<{
    title: string;
    view_count: number;
  }>;
} 