import type { RevenueSummary, TimeseriesItem, RevenueTimeseriesParams, CourseTransactionItems } from "./types";

// TODO: replace with real API calls when backend provides:
//   GET /admin/revenue/users/:userId/summary
//   GET /admin/revenue/users/:userId/timeseries

const MOCK_SUMMARY: RevenueSummary = {
  allTime: 12_500_000,
  thisMonth: 2_300_000,
  lastMonth: 1_800_000,
  growthPercent: 27.78,
  courses: [
    {
      courseId: 1,
      courseName: "React từ cơ bản đến nâng cao",
      allTime: 6_000_000,
      thisMonth: 1_200_000,
      lastMonth: 900_000,
      soldCount: 48,
      growthPercent: 33.33,
    },
    {
      courseId: 2,
      courseName: "NestJS & Microservices",
      allTime: 4_200_000,
      thisMonth: 800_000,
      lastMonth: 700_000,
      soldCount: 32,
      growthPercent: 14.29,
    },
    {
      courseId: 3,
      courseName: "TypeScript nâng cao",
      allTime: 2_300_000,
      thisMonth: 300_000,
      lastMonth: 200_000,
      soldCount: 18,
      growthPercent: 50,
    },
  ],
};

function buildMockTimeseries(from: string, to: string, granularity: string): TimeseriesItem[] {
  const result: TimeseriesItem[] = [];
  const start = new Date(from);
  const end = new Date(to);
  const cursor = new Date(start);

  while (cursor <= end) {
    result.push({
      date: cursor.toISOString().slice(0, 10),
      revenue: Math.floor(Math.random() * 500_000 + 100_000),
      soldCount: Math.floor(Math.random() * 5 + 1),
    });
    if (granularity === "monthly") {
      cursor.setMonth(cursor.getMonth() + 1);
    } else if (granularity === "weekly") {
      cursor.setDate(cursor.getDate() + 7);
    } else {
      cursor.setDate(cursor.getDate() + 1);
    }
  }
  return result;
}

function buildMockTransactionItems(
  userId: number,
  courseId: number,
  courseName: string,
  from: string,
  to: string,
): CourseTransactionItems {
  const items = Array.from({ length: 8 }, (_, i) => {
    const base = new Date(from);
    base.setDate(base.getDate() + Math.floor(i * 3.5));
    const paidAt = base.toISOString().slice(0, 10) + " 14:0" + i + ":00";
    const price = [199_000, 299_000, 399_000, 499_000][i % 4];
    return {
      transactionItemId: courseId * 1000 + i + 1,
      transactionId: userId * 10000 + courseId * 100 + i + 1,
      buyerUserId: 100 + i * 7,
      price,
      paidAt,
      provider: "payos",
      providerOrderId: i % 3 === 0 ? null : `PAYOS-${courseId}-${1000 + i}`,
      transactionTotalAmount: price,
    };
  });

  const totalRevenue = items.reduce((s, it) => s + it.price, 0);
  return { courseId, courseName, from, to, totalRevenue, totalItems: items.length, items };
}

export const adminRevenueApi = {
  getSummaryByUser: (_userId: number): Promise<RevenueSummary> => {
    return Promise.resolve(MOCK_SUMMARY);
  },

  getTimeseriesByUser: (
    _userId: number,
    params?: RevenueTimeseriesParams,
  ): Promise<TimeseriesItem[]> => {
    const today = new Date().toISOString().slice(0, 10);
    const from = params?.from ?? "2024-01-01";
    const to = params?.to ?? today;
    const granularity = params?.granularity ?? "monthly";
    return Promise.resolve(buildMockTimeseries(from, to, granularity));
  },

  // TODO: GET /admin/revenue/users/:userId/courses/:courseId/transaction-items
  getCourseTransactionItems: (
    userId: number,
    courseId: number,
    courseName: string,
    from?: string,
    to?: string,
  ): Promise<CourseTransactionItems> => {
    const today = new Date().toISOString().slice(0, 10);
    const resolvedFrom = from ?? "2024-01-01";
    const resolvedTo = to ?? today;
    return Promise.resolve(
      buildMockTransactionItems(userId, courseId, courseName, resolvedFrom, resolvedTo),
    );
  },
};
