export interface StatisticsResponse {
  totalApps: number;
  lastWeekNewApps: number;
  dailyActivity: Array<{
    date: string;
    count: number;
  }>;
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
  recentStatusChanges: Array<{
    status: string;
    count: number;
    color: string;
  }>;
  activeCategories: Array<{
    category: string;
    count: number;
  }>;
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
} 