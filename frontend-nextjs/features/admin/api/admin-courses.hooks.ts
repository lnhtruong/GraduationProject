import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminCourseApi } from "./admin-courses.api";
import type { PaginatedCourseResponse } from "./admin-courses.api";
import {
  USE_MOCK,
  MOCK_PENDING_COURSES,
  MOCK_ADMIN_COURSES,
  MOCK_LESSONS_BY_COURSE,
  MOCK_USERS,
} from "../mock/admin-courses.mock";
import type { Course, CourseListParams } from "@/features/courses/types";

const ADMIN_COURSE_KEYS = {
  all: ["admin", "courses"] as const,
  pending: ["admin", "courses", "pending"] as const,
  list: (params?: CourseListParams) =>
    ["admin", "courses", "list", params] as const,
  paginated: (params?: CourseListParams) =>
    ["admin", "courses", "paginated", params] as const,
  stats: (status: string) => ["admin", "courses", "stats", status] as const,
};

function makeMockPaginated(courses: Course[], params?: CourseListParams): PaginatedCourseResponse {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 10;
  const totalItems = courses.length;
  const totalPages = Math.ceil(totalItems / limit) || 1;
  const start = (page - 1) * limit;
  return { data: courses.slice(start, start + limit), pagination: { page, limit, totalItems, totalPages } };
}

export function useAdminPendingCourses() {
  return useQuery<Course[]>({
    queryKey: ADMIN_COURSE_KEYS.pending,
    queryFn: USE_MOCK
      ? () => Promise.resolve(MOCK_PENDING_COURSES)
      : () => adminCourseApi.listPending(),
    staleTime: 30_000,
  });
}

export function useAdminAllCourses(params?: CourseListParams) {
  return useQuery<Course[]>({
    queryKey: ADMIN_COURSE_KEYS.list(params),
    queryFn: USE_MOCK
      ? () => Promise.resolve(MOCK_ADMIN_COURSES)
      : () => adminCourseApi.listAll(params),
    staleTime: 30_000,
  });
}

export function useAdminCoursesPaginated(params?: CourseListParams) {
  return useQuery<PaginatedCourseResponse>({
    queryKey: ADMIN_COURSE_KEYS.paginated(params),
    queryFn: USE_MOCK
      ? () => {
          const base = params?.status === "pending" ? MOCK_PENDING_COURSES : MOCK_ADMIN_COURSES;
          return Promise.resolve(makeMockPaginated(base, params));
        }
      : () => adminCourseApi.listPaginated(params),
    staleTime: 30_000,
  });
}

export function useAdminCourseStats(status: "pending" | "approved" | "rejected") {
  return useQuery<PaginatedCourseResponse>({
    queryKey: ADMIN_COURSE_KEYS.stats(status),
    queryFn: USE_MOCK
      ? () => {
          const base = status === "pending" ? MOCK_PENDING_COURSES
            : MOCK_ADMIN_COURSES.filter((c) => c.status === status);
          return Promise.resolve(makeMockPaginated(base, { page: 1, limit: 1 }));
        }
      : () => adminCourseApi.listPaginated({ status, page: 1, limit: 1 }),
    staleTime: 60_000,
  });
}

export function useApproveCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (courseId: number) => adminCourseApi.approveCourse(courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_COURSE_KEYS.all });
    },
  });
}

export function useRejectCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (courseId: number) => adminCourseApi.rejectCourse(courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_COURSE_KEYS.all });
    },
  });
}

export function useCourseLessons(courseId: number | null) {
  return useQuery({
    queryKey: ["admin", "lessons", courseId],
    queryFn: USE_MOCK
      ? () => Promise.resolve(MOCK_LESSONS_BY_COURSE[courseId ?? 0] ?? [])
      : () => adminCourseApi.getLessonsByCourse(courseId!),
    enabled: courseId !== null,
    staleTime: 60_000,
  });
}

export function useInstructorUser(userId: number | null) {
  return useQuery({
    queryKey: ["admin", "user", userId],
    queryFn: USE_MOCK
      ? () => {
          const user = MOCK_USERS[userId ?? 0];
          // Simulate isError when userId not in mock map (e.g. userId=999)
          if (user === undefined) return Promise.reject(new Error("User not found"));
          return Promise.resolve(user);
        }
      : () => adminCourseApi.getUserById(userId!),
    enabled: userId !== null,
    staleTime: 5 * 60_000,
  });
}
