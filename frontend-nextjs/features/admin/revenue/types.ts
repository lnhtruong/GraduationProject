export type RevenueGranularity = "daily" | "weekly" | "monthly";

export type TransactionStatus = "pending" | "paid" | "failed";

export interface StatusBucket {
  count: number;
  amount: number;
}

export interface AdminRevenueSummary {
  allTime: number;
  thisMonth: number;
  lastMonth: number;
  growthPercent: number | null;
  paidOrders: number;
  coursesSold: number;
  statusBreakdown: Record<TransactionStatus, StatusBucket>;
  topCourses: TopCourse[];
  topInstructors: TopInstructor[];
}

export interface TopCourse {
  courseId: number;
  courseName: string;
  instructorId: number;
  instructorName: string;
  revenue: number;
  enrollCount: number;
}

export interface TopInstructor {
  instructorId: number;
  instructorName: string;
  revenue: number;
  courseCount: number;
  enrollCount: number;
}

export interface AdminTimeseriesItem {
  date: string;
  revenue: number;
  orderCount: number;
}

export interface CategoryRevenue {
  category: string;
  revenue: number;
  enrollCount: number;
}

export interface AdminRevenueTransaction {
  id: number;
  buyerUserId: number;
  buyerName: string;
  totalAmount: number;
  status: TransactionStatus;
  provider: string;
  providerOrderId: string | null;
  itemCount: number;
  createdAt: string | null;
  paidAt: string | null;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface PaginatedTransactions {
  data: AdminRevenueTransaction[];
  pagination: PaginationMeta;
}

export interface AdminRevenueTimeseriesParams {
  from?: string;
  to?: string;
  granularity?: RevenueGranularity;
}

export interface AdminRevenueTransactionsParams {
  status?: TransactionStatus;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}
