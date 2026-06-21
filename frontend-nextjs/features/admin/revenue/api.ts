import { apiHttpClient } from "@/features/_shared/api-factories";
import type {
  AdminRevenueSummary,
  AdminRevenueTimeseriesParams,
  AdminRevenueTransactionsParams,
  AdminTimeseriesItem,
  CategoryRevenue,
  PaginatedTransactions,
} from "./types";

export const adminRevenueApi = {
  getSummary: async (): Promise<AdminRevenueSummary> => {
    const { data } = await apiHttpClient.get<AdminRevenueSummary>(
      "/course/admin/revenue/summary",
    );
    return data;
  },

  getTimeseries: async (
    params?: AdminRevenueTimeseriesParams,
  ): Promise<AdminTimeseriesItem[]> => {
    const { data } = await apiHttpClient.get<AdminTimeseriesItem[]>(
      "/course/admin/revenue/timeseries",
      { params },
    );
    return data.map((item) => ({
      ...item,
      revenue: Number(item.revenue),
      orderCount: Number(item.orderCount),
    }));
  },

  getByCategory: async (
    from?: string,
    to?: string,
  ): Promise<CategoryRevenue[]> => {
    const params: Record<string, string> = {};
    if (from) params.from = from;
    if (to) params.to = to;
    const { data } = await apiHttpClient.get<CategoryRevenue[]>(
      "/course/admin/revenue/by-category",
      { params },
    );
    return data;
  },

  getTransactions: async (
    params?: AdminRevenueTransactionsParams,
  ): Promise<PaginatedTransactions> => {
    const { data } = await apiHttpClient.get<PaginatedTransactions>(
      "/course/admin/revenue/transactions",
      { params },
    );
    return data;
  },
};
