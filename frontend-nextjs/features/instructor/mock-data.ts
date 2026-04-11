// ─────────────────────────────────────────────────────────────────────────────
// MOCK DATA — Instructor Dashboard
// TODO: Swap sang real API khi backend sẵn sàng:
//   Dashboard:   GET /instructor/dashboard   → DashboardStats + recentCourses + recentQA
//   Courses:     GET /courses?userId=me       → InstructorCourse[]
//   Analytics:   GET /instructor/analytics   → AnalyticsStats + chart data
//   Q&A/Quizzes: GET /quizzes?courseUserId=me → QuizSummary[]
// ─────────────────────────────────────────────────────────────────────────────

import type {
  InstructorCourse,
  RecentQAItem,
  DashboardStats,
  AnalyticsStats,
  WeeklyDataPoint,
  RevenueDataPoint,
  CourseStudentsDataPoint,
  QuizSummary,
  QAOverallStats,
} from "./types";

// ── Courses ───────────────────────────────────────────────────────────────────

export const MOCK_INSTRUCTOR_COURSES: InstructorCourse[] = [
  {
    id: 1,
    name: "Lập trình Web cơ bản",
    description: "Khóa học về HTML, CSS, JavaScript dành cho người mới bắt đầu",
    thumbnailUrl: "https://images.unsplash.com/photo-1593720213428-28a5b9e94613?w=400&q=80",
    status: "publish",
    lessonCount: 12,
    studentCount: 245,
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 2,
    name: "React từ đầu",
    description: "Học React từ cơ bản đến nâng cao với các dự án thực tế",
    thumbnailUrl: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&q=80",
    status: "draft",
    lessonCount: 20,
    studentCount: 189,
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 3,
    name: "Node.js & Express API",
    description: "Xây dựng REST API chuyên nghiệp với Node.js và Express",
    thumbnailUrl: "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400&q=80",
    status: "pending",
    lessonCount: 15,
    studentCount: 0,
    updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 4,
    name: "TypeScript cho Developer",
    description: "Nắm vững TypeScript — từ type cơ bản đến generics nâng cao",
    status: "draft",
    lessonCount: 8,
    studentCount: 0,
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// ── Dashboard ─────────────────────────────────────────────────────────────────

export const MOCK_DASHBOARD_STATS: DashboardStats = {
  unansweredQA: 2,
  pendingPublish: 1,
};

export const MOCK_RECENT_QA: RecentQAItem[] = [
  {
    id: 1,
    authorName: "Minh Tuấn",
    courseName: "UI/UX Design Fundamentals — Figma & Beyond",
    content: "In Figma, what's the difference between Auto Layout and regular frames? I keep getting confused about when to use padding vs. margin.",
    createdAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    needsReply: true,
  },
  {
    id: 2,
    authorName: "Hà Linh",
    courseName: "Python for Data Science — Zero to Analyst",
    content: "Tại sao pandas df.groupby() lại trả về NaN cho một số cột? Tôi đang làm bài tập phần 3.",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    needsReply: true,
  },
  {
    id: 3,
    authorName: "Trần Khánh",
    courseName: "Lập trình Web cơ bản",
    content: "Flexbox và Grid khác nhau thế nào? Khi nào nên dùng cái nào ạ?",
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    needsReply: false,
  },
];

// ── Analytics ─────────────────────────────────────────────────────────────────

export const MOCK_ANALYTICS_STATS: AnalyticsStats = {
  totalViews: { value: 142800, changePercent: 12.5 },
  newStudents: { value: 2847, changePercent: 8.2 },
  revenue: { value: 48290000, changePercent: 15.3 },
  conversionRate: { value: 13.1, changePercent: 2.4 },
};

export const MOCK_WEEKLY_DATA: WeeklyDataPoint[] = [
  { week: "T1", views: 5500, students: 320 },
  { week: "T2", views: 6200, students: 380 },
  { week: "T3", views: 7100, students: 420 },
  { week: "T4", views: 6800, students: 390 },
  { week: "T5", views: 9500, students: 510 },
  { week: "T6", views: 11200, students: 620 },
  { week: "T7", views: 13400, students: 740 },
  { week: "T8", views: 18100, students: 890 },
];

export const MOCK_REVENUE_DATA: RevenueDataPoint[] = [
  { week: "T1", revenue: 3200000 },
  { week: "T2", revenue: 4100000 },
  { week: "T3", revenue: 3800000 },
  { week: "T4", revenue: 5200000 },
  { week: "T5", revenue: 4900000 },
  { week: "T6", revenue: 6700000 },
  { week: "T7", revenue: 7800000 },
  { week: "T8", revenue: 9500000 },
];

export const MOCK_STUDENTS_BY_COURSE: CourseStudentsDataPoint[] = [
  { courseName: "HTML Basics", students: 245 },
  { courseName: "React Hooks", students: 189 },
  { courseName: "CSS Grid", students: 134 },
  { courseName: "JS Arrays", students: 98 },
];

// ── Q&A / Quiz management ─────────────────────────────────────────────────────

export const MOCK_QA_STATS: QAOverallStats = {
  totalQuizzes: 4,
  totalQuestions: 26,
  totalCompletions: 413,
  avgScore: 84,
};

export const MOCK_QUIZZES: QuizSummary[] = [
  {
    id: 1,
    name: "Giới thiệu về HTML",
    courseName: "Lập trình Web cơ bản",
    questionCount: 5,
    completions: 120,
    avgScore: 85,
  },
  {
    id: 2,
    name: "Components và Props",
    courseName: "React từ đầu",
    questionCount: 8,
    completions: 95,
    avgScore: 78,
  },
  {
    id: 3,
    name: "CSS Flexbox",
    courseName: "Lập trình Web cơ bản",
    questionCount: 6,
    completions: 110,
    avgScore: 92,
  },
  {
    id: 4,
    name: "JS Arrays",
    courseName: "Lập trình Web cơ bản",
    questionCount: 7,
    completions: 88,
    avgScore: 76,
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Format relative time (e.g. "2 giờ trước") */
export function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  return `${days} ngày trước`;
}

/** Format currency (VND) */
export function formatVND(amount: number): string {
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)}B đ`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M đ`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K đ`;
  return `${amount.toLocaleString("vi-VN")} đ`;
}

/** Format large numbers (e.g. 142800 → "142.8K") */
export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}
