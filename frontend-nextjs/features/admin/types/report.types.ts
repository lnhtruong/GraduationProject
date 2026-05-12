export type ReportTargetType = "teacher" | "course" | "lesson";
export type ReportStatus = "pending" | "approved" | "rejected";

export interface ReportUser {
  id: number;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
}

export interface ReportTargetCourse {
  id: number;
  name: string;
  status: string;
  userId: number;
}

export interface ReportTargetLesson {
  id: number;
  title: string;
  status: string;
  courseId: number;
}

export interface ReportTargetTeacher {
  id: number;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  role: number;
  isBanned: boolean;
}

export type ReportTarget = ReportTargetCourse | ReportTargetLesson | ReportTargetTeacher | null;

export interface Report {
  id: number;
  targetType: ReportTargetType;
  targetId: number;
  reason: string;
  status: ReportStatus;
  reporterId: number;
  approverId: number | null;
  reviewNote: string | null;
  reviewedAt: string | null;
  created_at: string;
  updated_at: string;
  reporter?: ReportUser;
  approver?: ReportUser;
  target?: ReportTarget;
}

export interface ReportListResponse {
  items: Report[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface ReviewReportDto {
  decision: "approved" | "rejected";
  reviewNote?: string;
  banTarget?: boolean;
}

export interface ReportListParams {
  page?: number;
  limit?: number;
  status?: ReportStatus;
  targetType?: ReportTargetType;
}
