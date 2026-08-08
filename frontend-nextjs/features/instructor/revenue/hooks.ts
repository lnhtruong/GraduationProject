import { useQuery } from "@tanstack/react-query";
import { instructorRevenueApi } from "./api";
import type { RevenueTimeseriesParams } from "./types";

const KEYS = {
  summary: ["instructor", "revenue", "summary"] as const,
  summaryByRange: (from?: string, to?: string) =>
    ["instructor", "revenue", "summary", from, to] as const,
  coursesByRange: (from?: string, to?: string) =>
    ["instructor", "revenue", "courses", from, to] as const,
  timeseries: (params?: RevenueTimeseriesParams) =>
    ["instructor", "revenue", "timeseries", params] as const,
  transactionItems: (courseId: number, from?: string, to?: string) =>
    ["instructor", "revenue", "transaction-items", courseId, from, to] as const,
};

export function useRevenueSummary() {
  return useQuery({
    queryKey: KEYS.summary,
    queryFn: () => instructorRevenueApi.getSummary(),
    staleTime: 5 * 60_000,
  });
}

export function useRevenueSummaryByRange(from?: string, to?: string) {
  return useQuery({
    queryKey: KEYS.summaryByRange(from, to),
    queryFn: () => instructorRevenueApi.getSummaryByRange(from, to),
    enabled: Boolean(from && to),
    staleTime: 2 * 60_000,
  });
}

/** Doanh thu theo từng khoá học trong date range, đồng bộ với biểu đồ. */
export function useRevenueCoursesByRange(from?: string, to?: string) {
  return useQuery({
    queryKey: KEYS.coursesByRange(from, to),
    queryFn: () => instructorRevenueApi.getCourseRevenueByRange(from, to),
    enabled: Boolean(from && to),
    staleTime: 2 * 60_000,
  });
}

export function useRevenueTimeseries(params?: RevenueTimeseriesParams) {
  return useQuery({
    queryKey: KEYS.timeseries(params),
    queryFn: () => instructorRevenueApi.getTimeseries(params),
    staleTime: 2 * 60_000,
  });
}

export function useCourseTransactionItems(
  courseId: number | null,
  from?: string,
  to?: string,
) {
  return useQuery({
    queryKey: KEYS.transactionItems(courseId ?? 0, from, to),
    queryFn: () =>
      instructorRevenueApi.getCourseTransactionItems(courseId!, from, to),
    enabled: courseId !== null,
    staleTime: 2 * 60_000,
  });
}