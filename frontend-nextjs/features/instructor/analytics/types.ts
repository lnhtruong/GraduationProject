// ── Course Stats ──────────────────────────────────────────────────────────────

export interface CourseEnrollmentStats {
  total: number;
  active: number;
  completed: number;
  completionRate: number;
  averageProgress: number;
}

export interface CourseRatingStats {
  totalReviews: number;
  averageRating: number;
}

export interface CourseStatItem {
  courseId: number;
  courseName: string;
  enrollment: CourseEnrollmentStats;
  ratings: CourseRatingStats;
}

export interface CourseStatsSummary {
  totalCourses: number;
  totalEnrollments: number;
  activeEnrollments: number;
  completedEnrollments: number;
  completionRate: number;
  averageProgress: number;
  totalReviews: number;
  averageRating: number;
}

export interface CourseStatsOverview {
  summary: CourseStatsSummary;
  courses: CourseStatItem[];
}

// ── Feed Creator Stats ────────────────────────────────────────────────────────

export interface FeedStatItemStats {
  views: number;
  uniqueViewers: number;
  completedViews: number;
  completionRate: number;
  averageWatchDuration: number;
  likes: number;
  saves: number;
  shares: number;
  comments: number;
  engagementRate: number;
}

export interface FeedStatItem {
  feedId: number;
  title: string;
  course: { id: number; name: string };
  stats: FeedStatItemStats;
}

export interface FeedCreatorSummary {
  totalFeeds: number;
  views: number;
  likes: number;
  saves: number;
  shares: number;
  comments: number;
  completionRate: number;
}

export interface FeedCreatorStats {
  summary: FeedCreatorSummary;
  data: FeedStatItem[];
}

// ── Feed Trending ─────────────────────────────────────────────────────────────

export interface TrendingFeedItemStats {
  views: number;
  uniqueViewers: number;
  completedViews: number;
  completionRate: number;
  averageWatchDuration: number;
  likes: number;
  saves: number;
  shares: number;
  comments: number;
  score: number;
}

export interface TrendingFeedItem {
  rank: number;
  feedId: number;
  title: string;
  course: { id: number; name: string };
  stats: TrendingFeedItemStats;
}

export interface FeedTrending {
  period: string;
  data: TrendingFeedItem[];
}

// ── Shared ────────────────────────────────────────────────────────────────────

export type StatPeriod = "7d" | "30d" | "all";
