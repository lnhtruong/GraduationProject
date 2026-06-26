export type CourseChangeRequestStatus = "pending" | "approved" | "rejected";

export type CourseChangeRequestKind =
  | "course.update"
  | "lesson.create"
  | "lesson.update"
  | "lesson.delete"
  | "quiz.create"
  | "quiz.update"
  | "quiz.delete";

export type ChangeRequestPayload = Record<string, unknown>;

export interface ChangeRequestFieldDiff {
  field: string;
  from: unknown;
  to: unknown;
}

export interface ChangeRequestUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string | null;
}

export interface CourseChangeRequest {
  id: number;
  courseId: number;
  course_id: number;
  requestedBy: number;
  payload: ChangeRequestPayload;
  prevData: ChangeRequestPayload | null;
  kind: CourseChangeRequestKind;
  targetId: number | null;
  status: CourseChangeRequestStatus;
  reviewedBy: number | null;
  reviewNote: string | null;
  created_at: string;
  updated_at: string;
  /** Diff cũ → mới đã tính sẵn từ BE */
  changes: ChangeRequestFieldDiff[];
  /** Join từ BE */
  course?: { id: number; name: string; status: string } | null;
  requester?: ChangeRequestUser | null;
  reviewer?: ChangeRequestUser | null;
}

export interface ChangeRequestListParams {
  status?: CourseChangeRequestStatus;
  kind?: CourseChangeRequestKind;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ChangeRequestListResponse {
  data: CourseChangeRequest[];
  total: number;
  page: number;
  limit: number;
}

export interface ReviewChangeRequestDto {
  decision: "approved" | "rejected";
  note?: string;
}

export interface ReviewChangeRequestResponse {
  changeRequest: CourseChangeRequest;
  course: unknown | null;
}
