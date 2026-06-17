import { useQuery } from "@tanstack/react-query";
import { apiHttpClient } from "@/features/_shared/api-factories";
import { adminUsersApi, type AdminUser } from "./admin-users.api";
import { adminReportsApi } from "./admin-reports.api";
import { adminCourseApi } from "./admin-courses.api";

export interface AdminDashboardData {
  courses: {
    total: number | null;
    pending: number | null;
    published: number | null;
  };
  users: AdminUser[];
  pendingReports: number | null;
}

export function useAdminDashboardStats() {
  return useQuery<AdminDashboardData>({
    queryKey: ["admin", "dashboard", "overview"],
    queryFn: async () => {
      const [overviewRes, pendingCoursesRes, publishedCoursesRes, usersRes, reportsRes] =
        await Promise.allSettled([
          apiHttpClient.get("/course/courses/stats/overview"),
          adminCourseApi.listPaginated({ status: "pending", limit: 1 } as never),
          adminCourseApi.listPaginated({ status: "publish", limit: 1 } as never),
          adminUsersApi.listAll().then((r) => r.data),
          adminReportsApi.listAll({ status: "pending", limit: 1 } as never),
        ]);

      const totalCourses =
        overviewRes.status === "fulfilled"
          ? (overviewRes.value.data?.summary?.totalCourses ?? null)
          : null;

      const pendingCourses =
        pendingCoursesRes.status === "fulfilled"
          ? (pendingCoursesRes.value.pagination?.totalItems ?? null)
          : null;

      const publishedCourses =
        publishedCoursesRes.status === "fulfilled"
          ? (publishedCoursesRes.value.pagination?.totalItems ?? null)
          : null;

      const users: AdminUser[] =
        usersRes.status === "fulfilled" ? usersRes.value : [];

      const pendingReports =
        reportsRes.status === "fulfilled"
          ? (reportsRes.value.pagination?.totalItems ?? null)
          : null;

      return {
        courses: { total: totalCourses, pending: pendingCourses, published: publishedCourses },
        users,
        pendingReports,
      };
    },
    staleTime: 2 * 60_000,
  });
}
