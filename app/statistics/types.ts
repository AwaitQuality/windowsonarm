export interface StatusDistribution {
  status: string;
  count: number;
  percentage: number;
  color: string;
}

export interface CategoryDistribution {
  category: string;
  count: number;
  percentage: number;
}

export interface TagCount {
  tag: string;
  count: number;
}

export interface ActivityCounts {
  lastDay: number;
  lastWeek: number;
  lastMonth: number;
}

export interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
}

export interface MostReviewedApp {
  title: string;
  review_count: number;
  avg_rating: number;
}

export interface UpvotedApp {
  title: string;
  upvotes: number;
}

export interface DailyActivity {
  date: string;
  count: number;
}

export interface MostViewedApp {
  title: string;
  view_count: number;
}

export interface StatisticsResponse {
  totalApps: number;
  lastWeekNewApps: number;
  appsPerStatus: StatusDistribution[];
  appsPerCategory: CategoryDistribution[];
  topTags: TagCount[];
  recentActivity: ActivityCounts;
  averageRating: number;
  totalReviews: number;
  recentReviews: ReviewSummary;
  mostReviewedApps: MostReviewedApp[];
  upvoteStats: UpvotedApp[];
  dailyActivity: DailyActivity[];
  mostViewedApps: MostViewedApp[];
}
