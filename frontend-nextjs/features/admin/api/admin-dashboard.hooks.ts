import { useQuery } from "@tanstack/react-query";
import { courseStatsApi } from "@/features/instructor/analytics/api";

export function useAdminDashboardStats() {
  return useQuery({
    queryKey: ["admin", "dashboard", "stats"],
    queryFn: courseStatsApi.getOverview,
    staleTime: 5 * 60_000,
  });
}
