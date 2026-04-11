// ── Instructor dashboard types ────────────────────────────────────────────────
// TODO: Khi backend sẵn sàng, các interface này map 1-1 với API response shapes

export type CourseStatus =
  | "draft"
  | "pending"
  | "approved"
  | "rejected"
  | "publish";

export interface InstructorCourse {
  id: number;
  name: string;
  description: string;
  thumbnailUrl?: string;
  status: CourseStatus;
  lessonCount: number;
  studentCount: number;
  updatedAt: string;
}

export interface RecentQAItem {
  id: number;
  authorName: string;
  courseName: string;
  content: string;
  createdAt: string;
  needsReply: boolean;
}

export interface DashboardStats {
  unansweredQA: number;
  pendingPublish: number;
}

// ── Analytics ─────────────────────────────────────────────────────────────────

export interface StatMetric {
  value: number;
  /** positive = green badge, negative = red badge */
  changePercent: number;
}

export interface AnalyticsStats {
  /** TODO: no views table yet — backend needs to aggregate from a future views/events table */
  totalViews: StatMetric;
  /** delta of Enrolls count in last period */
  newStudents: StatMetric;
  /** SUM(payments.amount WHERE status='paid') */
  revenue: StatMetric;
  /** enrolls / views * 100 */
  conversionRate: StatMetric;
}

export interface WeeklyDataPoint {
  week: string; // "T1", "T2", ...
  views: number;
  students: number;
}

export interface RevenueDataPoint {
  week: string;
  revenue: number;
}

export interface CourseStudentsDataPoint {
  courseName: string;
  students: number;
}

// ── Q&A / Quiz management ─────────────────────────────────────────────────────

export interface QuizSummary {
  id: number;
  name: string;
  courseName: string;
  questionCount: number;
  completions: number;
  /** 0–100 */
  avgScore: number;
}

export interface QAOverallStats {
  totalQuizzes: number;
  totalQuestions: number;
  totalCompletions: number;
  avgScore: number;
}
