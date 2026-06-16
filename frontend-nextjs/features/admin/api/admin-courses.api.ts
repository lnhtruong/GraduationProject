import { courseWorkflowApi } from "@/features/courses/api/course.api";
import { apiHttpClient } from "@/features/_shared/api-factories";
import type { Course, CourseListParams, CourseStatus } from "@/features/courses/types";
import type { Lesson } from "@/features/lessons/types";

export interface InstructorUser {
  id: number;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  role?: number;
  avatarUrl?: string | null;
}

type LessonListApiResponse = {
  data?: Lesson[];
  pagination?: { totalItems: number };
};

export interface PaginatedCourseResponse {
  data: Course[];
  pagination: { page: number; limit: number; totalItems: number; totalPages: number };
}

type RawCourseListResponse = {
  data?: Array<{
    id?: number; name?: string; description?: string; categories?: string[];
    level?: string; duration?: string; language?: string; price?: number;
    userId?: number; status?: CourseStatus; created_at?: string; updated_at?: string;
  }>;
  pagination?: { page: number; limit: number; totalItems: number; totalPages: number };
};

export const adminCourseApi = {
  approveCourse: (id: number) => courseWorkflowApi.review(id, "accepted"),
  rejectCourse: (id: number) => courseWorkflowApi.review(id, "rejected"),

  listPaginated: async (params?: CourseListParams): Promise<PaginatedCourseResponse> => {
    const { data } = await apiHttpClient.get<RawCourseListResponse>(
      "/course/courses",
      { params },
    );
    const items: Course[] = (data?.data ?? []).map((raw) => ({
      id: raw.id ?? 0,
      name: raw.name ?? "",
      description: raw.description ?? "",
      categories: Array.isArray(raw.categories) ? raw.categories : [],
      level: (raw.level as Course["level"]) ?? "Beginner",
      duration: raw.duration,
      language: raw.language ?? "vi",
      price: raw.price ?? 0,
      userId: raw.userId ?? 0,
      status: raw.status ?? "draft",
      created_at: raw.created_at,
      updated_at: raw.updated_at,
    }));
    return {
      data: items,
      pagination: data?.pagination ?? { page: 1, limit: 10, totalItems: items.length, totalPages: 1 },
    };
  },

  getLessonsByCourse: async (courseId: number): Promise<Lesson[]> => {
    const { data } = await apiHttpClient.get<LessonListApiResponse>(
      `/course/lessons/course`,
      { params: { courseId, page: 1, limit: 100 } },
    );
    // BE trả array hoặc { data: [...] }
    return Array.isArray(data) ? data : (data?.data ?? []);
  },

  getUserById: async (userId: number): Promise<InstructorUser> => {
    const { data } = await apiHttpClient.get<InstructorUser>(
      `/users/${userId}`,
    );
    return data;
  },
};
