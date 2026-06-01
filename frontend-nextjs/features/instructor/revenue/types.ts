export interface RevenueSummary {
  allTime: number;
  thisMonth: number;
  lastMonth: number;
  growthPercent: number | null;
  courses: CourseRevenueSummary[];
}

export interface CourseRevenueSummary {
  courseId: number;
  courseName: string;
  allTime: number;
  thisMonth: number;
  lastMonth: number;
  enrollCount: number;
  growthPercent: number | null;
}

export interface TimeseriesItem {
  date: string;
  revenue: number;
  enrollCount: number;
}

export interface CourseTransactionItems {
  courseId: number;
  courseName: string;
  from: string;
  to: string;
  totalRevenue: number;
  totalItems: number;
  items: SaleItem[];
}

export interface SaleItem {
  transactionItemId: number;
  transactionId: number;
  buyerUserId: number;
  price: number;
  paidAt: string;
  provider: string;
  providerOrderId: string | null;
  transactionTotalAmount: number;
}

export type RevenueGranularity = "daily" | "weekly" | "monthly";

export interface RevenueTimeseriesParams {
  from?: string;
  to?: string;
  granularity?: RevenueGranularity;
}
