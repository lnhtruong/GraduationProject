export interface EnrolledCourse {
  id: number;
  name: string;
  thumbnailUrl: string | null;
  price: number;
  level: string | null;
  duration: string | null;
  status: string;
}

export interface EnrollRecord {
  id: number;
  userId: number;
  courseId: number;
  progress: number;
  status: "active" | "completed" | "dropped";
  enrolledAt: string;
  completedAt: string | null;
  course: EnrolledCourse;
}

export interface EnrollListResponse {
  data: EnrollRecord[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

export type EnrollStatusFilter = "active" | "completed";
