import { courseCrudApi, courseWorkflowApi } from "@/features/courses/api/course.api";
import { apiHttpClient } from "@/features/_shared/api-factories";
import type { Course, CourseListParams } from "@/features/courses/types";
import type { Lesson } from "@/features/lessons/types";
import type { PaginatedResponse } from "@/features/_shared/crud-factories";

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

export type PaginatedCourseResponse = PaginatedResponse<Course>;

export const adminCourseApi = {
  approveCourse: (id: number) => courseWorkflowApi.review(id, "accepted"),
  rejectCourse: (id: number) => courseWorkflowApi.review(id, "rejected"),

  listPaginated: (params?: CourseListParams) =>
    courseCrudApi.listPaginated!(params),

  getLessonsByCourse: async (courseId: number): Promise<Lesson[]> => {
    const { data } = await apiHttpClient.get<LessonListApiResponse>(
      `/course/lessons/course`,
      { params: { courseId, page: 1, limit: 100 } },
    );
    return Array.isArray(data) ? data : (data?.data ?? []);
  },

  getUserById: async (userId: number): Promise<InstructorUser> => {
    const { data } = await apiHttpClient.get<InstructorUser>(
      `/users/${userId}`,
    );
    return data;
  },
};
