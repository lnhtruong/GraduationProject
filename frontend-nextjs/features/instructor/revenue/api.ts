import { apiHttpClient } from "@/features/_shared/api-factories";
import type {
  CourseRevenueSummary,
  CourseTransactionItems,
  RevenueSummary,
  RevenueTimeseriesParams,
  TimeseriesItem,
  TimeseriesWithCoursesItem,
} from "./types";

/**
 * Aggregate doanh thu theo từng khoá học trong một khoảng date range.
 * Gọi timeseries?includeCourses=true rồi sum client-side theo courseId,
 * vì backend không có endpoint by-course riêng với from/to filter.
 * Khoá có 0 giao dịch trong range sẽ không xuất hiện — đây là hành vi đúng
 * vì backend INNER JOIN chỉ trả khoá có transaction; khoá 0 doanh thu
 * ALL-TIME thì từ summary.courses[] (không filter theo range).
 */
async function fetchCourseRevenueByRange(
  from?: string,
  to?: string,
): Promise<CourseRevenueSummary[]> {
  const { data } = await apiHttpClient.get<TimeseriesWithCoursesItem[]>(
    "/instructor/revenue/timeseries",
    { params: { granularity: "daily", includeCourses: true, from, to } },
  );

  const map = new Map<number, CourseRevenueSummary>();
  for (const bucket of data) {
    for (const c of bucket.courses ?? []) {
      const revenue = Number(c.revenue);
      const enrollCount = Number(c.enrollCount);
      const existing = map.get(c.courseId);
      if (existing) {
        existing.allTime += revenue;
        existing.enrollCount += enrollCount;
      } else {
        map.set(c.courseId, {
          courseId: c.courseId,
          courseName: c.courseName,
          allTime: revenue,
          thisMonth: 0,
          lastMonth: 0,
          enrollCount,
          growthPercent: null,
        });
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => b.allTime - a.allTime);
}

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
    return data.map((item) => ({
      ...item,
      revenue: Number(item.revenue),
      enrollCount: Number(item.enrollCount),
    }));
  },

  getCourseRevenueByRange: fetchCourseRevenueByRange,

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
