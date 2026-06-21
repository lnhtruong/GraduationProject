import { useQuery } from "@tanstack/react-query";
import { adminRevenueApi } from "./api";
import type {
  AdminRevenueTimeseriesParams,
  AdminRevenueTransactionsParams,
} from "./types";

const KEY = ["admin", "revenue"] as const;

export function useAdminRevenueSummary() {
  return useQuery({
    queryKey: [...KEY, "summary"],
    queryFn: adminRevenueApi.getSummary,
    staleTime: 2 * 60_000,
  });
}

export function useAdminRevenueTimeseries(params: AdminRevenueTimeseriesParams) {
  return useQuery({
    queryKey: [...KEY, "timeseries", params],
    queryFn: () => adminRevenueApi.getTimeseries(params),
    staleTime: 2 * 60_000,
  });
}

export function useAdminRevenueByCategory(from?: string, to?: string) {
  return useQuery({
    queryKey: [...KEY, "by-category", from, to],
    queryFn: () => adminRevenueApi.getByCategory(from, to),
    staleTime: 2 * 60_000,
  });
}

export function useAdminRevenueTransactions(
  params: AdminRevenueTransactionsParams,
) {
  return useQuery({
    queryKey: [...KEY, "transactions", params],
    queryFn: () => adminRevenueApi.getTransactions(params),
    staleTime: 60_000,
  });
}
