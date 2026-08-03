export type LecturerRequestStatus = "pending" | "approved" | "rejected";

export interface LecturerRequestUser {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  role: number;
}

export interface LecturerRequest {
  id: number;
  userId: number;
  confirm: string | null;
  status: LecturerRequestStatus;
  reviewNote: string | null;
  reviewedAt: string | null;
  reviewerId: number | null;
  created_at: string;
  updated_at: string;
  evidenceImageIds: number[] | null;
  evidenceImages?: Array<{
    imageId: number;
    url: string;
    name?: string | null;
    format?: string | null;
    type: "role_upgrade" | "report";
  }>;
  requester?: LecturerRequestUser;
  reviewer?: LecturerRequestUser;
}

export interface CreateLecturerRequestDto {
  confirm?: string;
  evidenceImageIds: number[];
}

export interface ReviewLecturerRequestDto {
  approve: boolean;
  reviewNote?: string;
}

export interface LecturerRequestListParams {
  page?: number;
  limit?: number;
  status?: LecturerRequestStatus;
  search?: string;
}

export interface LecturerRequestListResponse {
  items: LecturerRequest[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}
