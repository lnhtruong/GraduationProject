import { apiHttpClient } from "@/features/_shared/api-factories";
import type {
  CourseTransactionItems,
  RevenueSummary,
  RevenueTimeseriesParams,
  TimeseriesItem,
} from "./types";

export const instructorRevenueApi = {
  getSummary: async (): Promise<RevenueSummary> => {
    const { data } = await apiHttpClient.get<RevenueSummary>(
      "/instructor/revenue/summary",
    );
    return data;
  },

  getTimeseries: async (
    params?: RevenueTimeseriesParams,
  ): Promise<TimeseriesItem[]> => {
    const { data } = await apiHttpClient.get<TimeseriesItem[]>(
      "/instructor/revenue/timeseries",
      { params },
    );
    return data;
  },

  getCourseTransactionItems: async (
    courseId: number,
    from?: string,
    to?: string,
  ): Promise<CourseTransactionItems> => {
    const params: Record<string, string> = {};
    if (from && to) {
      params.from = from;
      params.to = to;
    }
    const { data } = await apiHttpClient.get<CourseTransactionItems>(
      `/instructor/revenue/${courseId}/transaction-items`,
      { params },
    );
    return data;
  },
};
