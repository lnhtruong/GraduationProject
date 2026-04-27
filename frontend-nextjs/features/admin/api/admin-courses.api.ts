import {
  courseApi,
  courseWorkflowApi,
} from "@/features/courses/api/course.api";
import { apiHttpClient } from "@/features/_shared/api-factories";
import type { CourseListParams } from "@/features/courses/types";
import type { Lesson } from "@/features/lessons/types";

export interface InstructorUser {
  id: number;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  role?: number;
}

type LessonListApiResponse = {
  data?: Lesson[];
  pagination?: { totalItems: number };
};

export const adminCourseApi = {
  listPending: () => courseApi.getAll({ status: "pending" } as CourseListParams),
  listAll: (params?: CourseListParams) => courseApi.getAll(params),
  approveCourse: (id: number) => courseWorkflowApi.review(id, "accepted"),
  rejectCourse: (id: number) => courseWorkflowApi.review(id, "rejected"),

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
