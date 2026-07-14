import { useQuery } from "@tanstack/react-query";
import { apiHttpClient } from "@/features/_shared/api-factories";
import { adminUsersApi } from "./admin-users.api";
import { adminReportsApi } from "./admin-reports.api";

/** Dùng ở các mutation hook khác (courses/change-requests/users/reports) để
 * invalidate số liệu dashboard sau khi thao tác thành công. */
export const ADMIN_DASHBOARD_KEY = ["admin", "dashboard"] as const;

export interface AdminDashboardData {
  courses: {
    total: number | null;
    pending: number | null;
    approved: number | null;
    rejected: number | null;
    totalEnrollments: number | null;
  };
  changeRequests: {
    pending: number | null;
    approved: number | null;
    rejected: number | null;
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
    queryKey: [...ADMIN_DASHBOARD_KEY, "overview"],
    queryFn: async () => {
      const [overviewRes, courseStatsRes, changeRequestStatsRes, userStatsRes, reportsRes] =
        await Promise.allSettled([
          apiHttpClient.get("/course/courses/stats/overview"),
          apiHttpClient.get("/course/courses/stats"),
          apiHttpClient.get("/course/courses/change-requests/stats"),
          adminUsersApi.getStats(),
          adminReportsApi.listAll({ status: "pending" }),
        ]);

      const summary =
        overviewRes.status === "fulfilled"
          ? overviewRes.value.data?.summary
          : null;

      const courseStats =
        courseStatsRes.status === "fulfilled"
          ? courseStatsRes.value.data
          : null;

      const changeRequestStats =
        changeRequestStatsRes.status === "fulfilled"
          ? changeRequestStatsRes.value.data
          : null;

      const userStats =
        userStatsRes.status === "fulfilled" ? userStatsRes.value : null;

      return {
        courses: {
          total: summary?.totalCourses ?? null,
          pending: courseStats?.pending ?? null,
          approved: courseStats?.approved ?? null,
          rejected: courseStats?.rejected ?? null,
          totalEnrollments: summary?.totalEnrollments ?? null,
        },
        changeRequests: {
          pending: changeRequestStats?.pending ?? null,
          approved: changeRequestStats?.approved ?? null,
          rejected: changeRequestStats?.rejected ?? null,
        },
        users: {
          total: userStats?.total ?? null,
          students: userStats?.students ?? null,
          lecturers: userStats?.lecturers ?? null,
        },
        pendingReports: reportsRes.status === "fulfilled" ? (reportsRes.value.pagination?.totalItems ?? null) : null,
      };
    },
    staleTime: 2 * 60_000,
  });
}
