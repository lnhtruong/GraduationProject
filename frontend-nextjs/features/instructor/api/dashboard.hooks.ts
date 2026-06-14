import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "./dashboard.api";
import type { Course } from "@/features/courses/types";

export function useInstructorCourses() {
  return useQuery({
    queryKey: ["instructor", "dashboard", "courses"],
    queryFn: dashboardApi.listMyCourses,
    staleTime: 2 * 60_000,
  });
}

/** Derived: khoá học status="approved" chờ instructor publish */
export function usePendingPublishCount() {
  const { data: courses = [] } = useInstructorCourses();
  return courses.filter((c: Course) => c.status === "approved").length;
}
