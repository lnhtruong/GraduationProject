import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminCourseApi } from "./admin-courses.api";
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
};

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
      ? () => Promise.resolve(MOCK_USERS[userId ?? 0] ?? null)
      : () => adminCourseApi.getUserById(userId!),
    enabled: userId !== null,
    staleTime: 5 * 60_000,
  });
}
