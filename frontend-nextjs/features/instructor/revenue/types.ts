export interface RevenueSummary {
  allTime: number;
  thisMonth: number;
  lastMonth: number;
  grossRevenue?: number;
  platformFeePercent?: number;
  platformFeeAmount?: number;
  withholdingBaseAmount?: number;
  vatPercent?: number;
  vatAmount?: number;
  pitPercent?: number;
  pitAmount?: number;
  taxPercent?: number;
  taxAmount?: number;
  annualTaxExemptThreshold?: number;
  netRevenue?: number;
  thisMonthNetRevenue?: number;
  lastMonthNetRevenue?: number;
  growthPercent: number | null;
  courses: CourseRevenueSummary[];
}

export interface CourseRevenueSummary {
  courseId: number;
  courseName: string;
  thumbnailUrl?: string | null;
  avgRating?: number | null;
  allTime: number;
  thisMonth: number;
  lastMonth: number;
  grossRevenue?: number;
  platformFeePercent?: number;
  platformFeeAmount?: number;
  withholdingBaseAmount?: number;
  vatPercent?: number;
  vatAmount?: number;
  pitPercent?: number;
  pitAmount?: number;
  taxPercent?: number;
  taxAmount?: number;
  netRevenue?: number;
  thisMonthNetRevenue?: number;
  lastMonthNetRevenue?: number;
  enrollCount: number;
  growthPercent: number | null;
}

export interface TimeseriesItem {
  date: string;
  revenue: number;
  grossRevenue?: number;
  platformFeePercent?: number;
  platformFeeAmount?: number;
  withholdingBaseAmount?: number;
  vatPercent?: number;
  vatAmount?: number;
  pitPercent?: number;
  pitAmount?: number;
  taxPercent?: number;
  taxAmount?: number;
  netRevenue?: number;
  enrollCount: number;
}

export interface TimeseriesWithCoursesItem extends TimeseriesItem {
  courses?: {
    courseId: number;
    courseName: string;
    revenue: number;
    grossRevenue?: number;
    platformFeePercent?: number;
    platformFeeAmount?: number;
    withholdingBaseAmount?: number;
    vatPercent?: number;
    vatAmount?: number;
    pitPercent?: number;
    pitAmount?: number;
    taxPercent?: number;
    taxAmount?: number;
    netRevenue?: number;
    enrollCount: number;
  }[];
}

export interface CourseTransactionItems {
  courseId: number;
  courseName: string;
  from: string;
  to: string;
  totalRevenue: number;
  platformFeePercent?: number;
  platformFeeAmount?: number;
  withholdingBaseAmount?: number;
  vatPercent?: number;
  vatAmount?: number;
  pitPercent?: number;
  pitAmount?: number;
  taxPercent?: number;
  taxAmount?: number;
  netRevenue?: number;
  totalItems: number;
  items: SaleItem[];
}

export interface SaleItem {
  transactionItemId: number;
  transactionId: number;
  buyerUserId: number;
  buyerName?: string;
  price: number;
  grossRevenue?: number;
  platformFeePercent?: number;
  platformFeeAmount?: number;
  withholdingBaseAmount?: number;
  vatPercent?: number;
  vatAmount?: number;
  pitPercent?: number;
  pitAmount?: number;
  taxPercent?: number;
  taxAmount?: number;
  netAmount?: number;
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
