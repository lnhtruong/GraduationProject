import { useQuery } from "@tanstack/react-query";
import { adminRevenueApi } from "./api";
import type { RevenueTimeseriesParams } from "./types";

const KEYS = {
  summary: (userId: number) => ["admin", "revenue", "summary", userId] as const,
  timeseries: (userId: number, params?: RevenueTimeseriesParams) =>
    ["admin", "revenue", "timeseries", userId, params] as const,
  transactionItems: (userId: number, courseId: number, from?: string, to?: string) =>
    ["admin", "revenue", "transaction-items", userId, courseId, from, to] as const,
};

export function useAdminRevenueSummary(userId: number | null) {
  return useQuery({
    queryKey: KEYS.summary(userId ?? 0),
    queryFn: () => adminRevenueApi.getSummaryByUser(userId!),
    enabled: userId !== null,
    staleTime: 5 * 60_000,
  });
}

export function useAdminRevenueTimeseries(
  userId: number | null,
  params?: RevenueTimeseriesParams,
) {
  return useQuery({
    queryKey: KEYS.timeseries(userId ?? 0, params),
    queryFn: () => adminRevenueApi.getTimeseriesByUser(userId!, params),
    enabled: userId !== null,
    staleTime: 2 * 60_000,
  });
}

export function useAdminCourseTransactionItems(
  userId: number | null,
  courseId: number | null,
  courseName: string,
  from?: string,
  to?: string,
) {
  return useQuery({
    queryKey: KEYS.transactionItems(userId ?? 0, courseId ?? 0, from, to),
    queryFn: () =>
      adminRevenueApi.getCourseTransactionItems(userId!, courseId!, courseName, from, to),
    enabled: userId !== null && courseId !== null,
    staleTime: 2 * 60_000,
  });
}
