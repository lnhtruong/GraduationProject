import { useQuery } from "@tanstack/react-query";
import { apiHttpClient } from "@/features/_shared/api-factories";
import { adminUsersApi } from "./admin-users.api";
import { adminReportsApi } from "./admin-reports.api";
import { adminCourseApi } from "./admin-courses.api";
import { ROLES } from "@/lib/roles";

export interface AdminDashboardData {
  courses: {
    total: number | null;
    pending: number | null;
    published: number | null;
    totalEnrollments: number | null;
  };
  users: {
    total: number | null;
    students: number | null;
    lecturers: number | null;
  };
  pendingReports: number | null;
}

export function useAdminDashboardStats() {
  return useQuery<AdminDashboardData>({
    queryKey: ["admin", "dashboard", "overview"],
    queryFn: async () => {
      const [overviewRes, pendingCoursesRes, publishedCoursesRes, allUsersRes, studentsRes, lecturersRes, reportsRes] =
        await Promise.allSettled([
          apiHttpClient.get("/course/courses/stats/overview"),
          adminCourseApi.listPaginated({ status: "pending", limit: 1 }),
          adminCourseApi.listPaginated({ status: "publish", limit: 1 }),
          adminUsersApi.listAll({ limit: 1 }),
          adminUsersApi.listAll({ limit: 1, role: ROLES.STUDENT }),
          adminUsersApi.listAll({ limit: 1, role: ROLES.LECTURER }),
          adminReportsApi.listAll({ status: "pending" }),
        ]);

      const summary =
        overviewRes.status === "fulfilled"
          ? overviewRes.value.data?.summary
          : null;

      return {
        courses: {
          total: summary?.totalCourses ?? null,
          pending: pendingCoursesRes.status === "fulfilled" ? (pendingCoursesRes.value.pagination?.totalItems ?? null) : null,
          published: publishedCoursesRes.status === "fulfilled" ? (publishedCoursesRes.value.pagination?.totalItems ?? null) : null,
          totalEnrollments: summary?.totalEnrollments ?? null,
        },
        users: {
          total: allUsersRes.status === "fulfilled" ? (allUsersRes.value.pagination?.totalItems ?? null) : null,
          students: studentsRes.status === "fulfilled" ? (studentsRes.value.pagination?.totalItems ?? null) : null,
          lecturers: lecturersRes.status === "fulfilled" ? (lecturersRes.value.pagination?.totalItems ?? null) : null,
        },
        pendingReports: reportsRes.status === "fulfilled" ? (reportsRes.value.pagination?.totalItems ?? null) : null,
      };
    },
    staleTime: 2 * 60_000,
  });
}
