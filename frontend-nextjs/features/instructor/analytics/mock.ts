import type {
  CourseStatsOverview,
  FeedCreatorStats,
  FeedTrending,
} from "./types";

export const MOCK_COURSE_STATS: CourseStatsOverview = {
  summary: {
    totalCourses: 4,
    totalEnrollments: 523,
    activeEnrollments: 310,
    completedEnrollments: 213,
    completionRate: 40.73,
    averageProgress: 62.45,
    totalReviews: 187,
    averageRating: 4.32,
  },
  courses: [
    {
      courseId: 1,
      courseName: "Lập trình Web cơ bản",
      enrollment: { total: 245, active: 150, completed: 95, completionRate: 38.78, averageProgress: 67.2 },
      ratings: { totalReviews: 89, averageRating: 4.5 },
    },
    {
      courseId: 2,
      courseName: "React từ đầu",
      enrollment: { total: 189, active: 120, completed: 69, completionRate: 36.51, averageProgress: 58.3 },
      ratings: { totalReviews: 64, averageRating: 4.3 },
    },
    {
      courseId: 3,
      courseName: "Node.js & Express API",
      enrollment: { total: 73, active: 32, completed: 41, completionRate: 56.16, averageProgress: 71.8 },
      ratings: { totalReviews: 28, averageRating: 4.1 },
    },
    {
      courseId: 4,
      courseName: "TypeScript cho Developer",
      enrollment: { total: 16, active: 8, completed: 8, completionRate: 50.0, averageProgress: 55.0 },
      ratings: { totalReviews: 6, averageRating: 4.7 },
    },
  ],
};

export const MOCK_FEED_CREATOR_STATS: FeedCreatorStats = {
  summary: {
    totalFeeds: 12,
    views: 14520,
    likes: 1832,
    saves: 743,
    shares: 298,
    comments: 415,
    completionRate: 54.38,
  },
  data: [
    {
      feedId: 1,
      title: "5 tips tối ưu React performance",
      course: { id: 2, name: "React từ đầu" },
      stats: { views: 3840, uniqueViewers: 2910, completedViews: 2150, completionRate: 56.0, averageWatchDuration: 42.5, likes: 512, saves: 198, shares: 87, comments: 134, engagementRate: 24.3 },
    },
    {
      feedId: 2,
      title: "useEffect vs useLayoutEffect",
      course: { id: 2, name: "React từ đầu" },
      stats: { views: 2760, uniqueViewers: 2100, completedViews: 1430, completionRate: 51.8, averageWatchDuration: 38.2, likes: 380, saves: 145, shares: 62, comments: 98, engagementRate: 21.2 },
    },
    {
      feedId: 3,
      title: "CSS Flexbox trong 60 giây",
      course: { id: 1, name: "Lập trình Web cơ bản" },
      stats: { views: 2340, uniqueViewers: 1890, completedViews: 1680, completionRate: 71.8, averageWatchDuration: 55.0, likes: 310, saves: 198, shares: 72, comments: 55, engagementRate: 27.1 },
    },
    {
      feedId: 4,
      title: "JWT Authentication với Node.js",
      course: { id: 3, name: "Node.js & Express API" },
      stats: { views: 1980, uniqueViewers: 1450, completedViews: 980, completionRate: 49.5, averageWatchDuration: 36.8, likes: 420, saves: 130, shares: 52, comments: 89, engagementRate: 34.9 },
    },
    {
      feedId: 5,
      title: "TypeScript Generics cơ bản",
      course: { id: 4, name: "TypeScript cho Developer" },
      stats: { views: 1420, uniqueViewers: 1100, completedViews: 710, completionRate: 50.0, averageWatchDuration: 44.2, likes: 210, saves: 72, shares: 25, comments: 39, engagementRate: 24.4 },
    },
  ],
};

export const MOCK_FEED_TRENDING: FeedTrending = {
  period: "all",
  data: [
    {
      rank: 1,
      feedId: 1,
      title: "5 tips tối ưu React performance",
      course: { id: 2, name: "React từ đầu" },
      stats: { views: 3840, uniqueViewers: 2910, completedViews: 2150, completionRate: 56.0, averageWatchDuration: 42.5, likes: 512, saves: 198, shares: 87, comments: 134, score: 3247.5 },
    },
    {
      rank: 2,
      feedId: 4,
      title: "JWT Authentication với Node.js",
      course: { id: 3, name: "Node.js & Express API" },
      stats: { views: 1980, uniqueViewers: 1450, completedViews: 980, completionRate: 49.5, averageWatchDuration: 36.8, likes: 420, saves: 130, shares: 52, comments: 89, score: 2987.0 },
    },
    {
      rank: 3,
      feedId: 3,
      title: "CSS Flexbox trong 60 giây",
      course: { id: 1, name: "Lập trình Web cơ bản" },
      stats: { views: 2340, uniqueViewers: 1890, completedViews: 1680, completionRate: 71.8, averageWatchDuration: 55.0, likes: 310, saves: 198, shares: 72, comments: 55, score: 2653.2 },
    },
    {
      rank: 4,
      feedId: 2,
      title: "useEffect vs useLayoutEffect",
      course: { id: 2, name: "React từ đầu" },
      stats: { views: 2760, uniqueViewers: 2100, completedViews: 1430, completionRate: 51.8, averageWatchDuration: 38.2, likes: 380, saves: 145, shares: 62, comments: 98, score: 2533.8 },
    },
    {
      rank: 5,
      feedId: 5,
      title: "TypeScript Generics cơ bản",
      course: { id: 4, name: "TypeScript cho Developer" },
      stats: { views: 1420, uniqueViewers: 1100, completedViews: 710, completionRate: 50.0, averageWatchDuration: 44.2, likes: 210, saves: 72, shares: 25, comments: 39, score: 1563.0 },
    },
  ],
};
