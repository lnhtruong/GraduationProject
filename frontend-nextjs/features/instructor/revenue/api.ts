import { apiHttpClient } from "@/features/_shared/api-factories";
import {
  INSTRUCTOR_PIT_WITHHOLDING_PERCENT,
  INSTRUCTOR_TAX_BASE_MODE,
  INSTRUCTOR_TAX_EXEMPT_ANNUAL_REVENUE_VND,
  INSTRUCTOR_VAT_WITHHOLDING_PERCENT,
  PLATFORM_FEE_PERCENT,
} from "@/lib/env";
import type {
  CourseRevenueSummary,
  CourseTransactionItems,
  RevenueSummary,
  RevenueTimeseriesParams,
  SaleItem,
  TimeseriesItem,
  TimeseriesWithCoursesItem,
} from "./types";

const PLATFORM_FEE_RATE = PLATFORM_FEE_PERCENT ?? 20;

type RevenueBreakdown = {
  grossRevenue: number;
  platformFeePercent: number;
  platformFeeAmount: number;
  withholdingBaseAmount: number;
  vatPercent: number;
  vatAmount: number;
  pitPercent: number;
  pitAmount: number;
  taxPercent: number;
  taxAmount: number;
  annualTaxExemptThreshold: number;
  netRevenue: number;
};

function roundCurrency(value: number): number {
  return Number(value.toFixed(2));
}

function numberOrZero(value: unknown): number {
  return Number(value) || 0;
}

function calculateBreakdown(grossRevenue: number): RevenueBreakdown {
  const gross = roundCurrency(numberOrZero(grossRevenue));
  const platformFeeAmount = roundCurrency((gross * PLATFORM_FEE_RATE) / 100);
  const postPlatformFeeAmount = roundCurrency(gross - platformFeeAmount);
  const withholdingBaseAmount =
    INSTRUCTOR_TAX_BASE_MODE === "after_platform_fee" ? postPlatformFeeAmount : gross;
  const vatAmount = roundCurrency(
    (withholdingBaseAmount * INSTRUCTOR_VAT_WITHHOLDING_PERCENT) / 100,
  );
  const pitAmount = roundCurrency(
    (withholdingBaseAmount * INSTRUCTOR_PIT_WITHHOLDING_PERCENT) / 100,
  );
  const taxAmount = roundCurrency(vatAmount + pitAmount);
  const taxPercent = roundCurrency(
    INSTRUCTOR_VAT_WITHHOLDING_PERCENT + INSTRUCTOR_PIT_WITHHOLDING_PERCENT,
  );

  return {
    grossRevenue: gross,
    platformFeePercent: PLATFORM_FEE_RATE,
    platformFeeAmount,
    withholdingBaseAmount,
    vatPercent: INSTRUCTOR_VAT_WITHHOLDING_PERCENT,
    vatAmount,
    pitPercent: INSTRUCTOR_PIT_WITHHOLDING_PERCENT,
    pitAmount,
    taxPercent,
    taxAmount,
    annualTaxExemptThreshold: INSTRUCTOR_TAX_EXEMPT_ANNUAL_REVENUE_VND,
    netRevenue: roundCurrency(gross - platformFeeAmount - taxAmount),
  };
}

function enrichCourseRevenue(course: CourseRevenueSummary): CourseRevenueSummary {
  const allTime = numberOrZero(course.allTime);
  const thisMonth = numberOrZero(course.thisMonth);
  const lastMonth = numberOrZero(course.lastMonth);
  const allTimeBreakdown = calculateBreakdown(allTime);
  const thisMonthBreakdown = calculateBreakdown(thisMonth);
  const lastMonthBreakdown = calculateBreakdown(lastMonth);

  return {
    ...course,
    allTime,
    thisMonth,
    lastMonth,
    enrollCount: numberOrZero(course.enrollCount),
    grossRevenue: course.grossRevenue ?? allTimeBreakdown.grossRevenue,
    platformFeePercent: course.platformFeePercent ?? allTimeBreakdown.platformFeePercent,
    platformFeeAmount: course.platformFeeAmount ?? allTimeBreakdown.platformFeeAmount,
    withholdingBaseAmount:
      course.withholdingBaseAmount ?? allTimeBreakdown.withholdingBaseAmount,
    vatPercent: course.vatPercent ?? allTimeBreakdown.vatPercent,
    vatAmount: course.vatAmount ?? allTimeBreakdown.vatAmount,
    pitPercent: course.pitPercent ?? allTimeBreakdown.pitPercent,
    pitAmount: course.pitAmount ?? allTimeBreakdown.pitAmount,
    taxPercent: course.taxPercent ?? allTimeBreakdown.taxPercent,
    taxAmount: course.taxAmount ?? allTimeBreakdown.taxAmount,
    netRevenue: course.netRevenue ?? allTimeBreakdown.netRevenue,
    thisMonthNetRevenue: course.thisMonthNetRevenue ?? thisMonthBreakdown.netRevenue,
    lastMonthNetRevenue: course.lastMonthNetRevenue ?? lastMonthBreakdown.netRevenue,
  };
}

function enrichSaleItem(item: SaleItem): SaleItem {
  const price = numberOrZero(item.price);
  const breakdown = calculateBreakdown(price);

  return {
    ...item,
    price,
    grossRevenue: item.grossRevenue ?? breakdown.grossRevenue,
    platformFeePercent: item.platformFeePercent ?? breakdown.platformFeePercent,
    platformFeeAmount: item.platformFeeAmount ?? breakdown.platformFeeAmount,
    withholdingBaseAmount: item.withholdingBaseAmount ?? breakdown.withholdingBaseAmount,
    vatPercent: item.vatPercent ?? breakdown.vatPercent,
    vatAmount: item.vatAmount ?? breakdown.vatAmount,
    pitPercent: item.pitPercent ?? breakdown.pitPercent,
    pitAmount: item.pitAmount ?? breakdown.pitAmount,
    taxPercent: item.taxPercent ?? breakdown.taxPercent,
    taxAmount: item.taxAmount ?? breakdown.taxAmount,
    netAmount: item.netAmount ?? breakdown.netRevenue,
    transactionTotalAmount: numberOrZero(item.transactionTotalAmount),
  };
}

function enrichSummary(data: RevenueSummary): RevenueSummary {
  const allTime = numberOrZero(data.allTime);
  const thisMonth = numberOrZero(data.thisMonth);
  const lastMonth = numberOrZero(data.lastMonth);
  const allTimeBreakdown = calculateBreakdown(allTime);
  const thisMonthBreakdown = calculateBreakdown(thisMonth);
  const lastMonthBreakdown = calculateBreakdown(lastMonth);

  return {
    ...data,
    allTime,
    thisMonth,
    lastMonth,
    grossRevenue: data.grossRevenue ?? allTimeBreakdown.grossRevenue,
    platformFeePercent: data.platformFeePercent ?? allTimeBreakdown.platformFeePercent,
    platformFeeAmount: data.platformFeeAmount ?? allTimeBreakdown.platformFeeAmount,
    withholdingBaseAmount:
      data.withholdingBaseAmount ?? allTimeBreakdown.withholdingBaseAmount,
    vatPercent: data.vatPercent ?? allTimeBreakdown.vatPercent,
    vatAmount: data.vatAmount ?? allTimeBreakdown.vatAmount,
    pitPercent: data.pitPercent ?? allTimeBreakdown.pitPercent,
    pitAmount: data.pitAmount ?? allTimeBreakdown.pitAmount,
    taxPercent: data.taxPercent ?? allTimeBreakdown.taxPercent,
    taxAmount: data.taxAmount ?? allTimeBreakdown.taxAmount,
    annualTaxExemptThreshold:
      data.annualTaxExemptThreshold ?? allTimeBreakdown.annualTaxExemptThreshold,
    netRevenue: data.netRevenue ?? allTimeBreakdown.netRevenue,
    thisMonthNetRevenue: data.thisMonthNetRevenue ?? thisMonthBreakdown.netRevenue,
    lastMonthNetRevenue: data.lastMonthNetRevenue ?? lastMonthBreakdown.netRevenue,
    courses: (data.courses ?? []).map(enrichCourseRevenue),
  };
}

function enrichTimeseriesItem(item: TimeseriesItem): TimeseriesItem {
  const revenue = numberOrZero(item.revenue);
  const breakdown = calculateBreakdown(revenue);

  return {
    ...item,
    revenue,
    grossRevenue: item.grossRevenue ?? breakdown.grossRevenue,
    platformFeePercent: item.platformFeePercent ?? breakdown.platformFeePercent,
    platformFeeAmount: item.platformFeeAmount ?? breakdown.platformFeeAmount,
    withholdingBaseAmount: item.withholdingBaseAmount ?? breakdown.withholdingBaseAmount,
    vatPercent: item.vatPercent ?? breakdown.vatPercent,
    vatAmount: item.vatAmount ?? breakdown.vatAmount,
    pitPercent: item.pitPercent ?? breakdown.pitPercent,
    pitAmount: item.pitAmount ?? breakdown.pitAmount,
    taxPercent: item.taxPercent ?? breakdown.taxPercent,
    taxAmount: item.taxAmount ?? breakdown.taxAmount,
    netRevenue: item.netRevenue ?? breakdown.netRevenue,
    enrollCount: numberOrZero(item.enrollCount),
  };
}

function addIfPresent(current: number | undefined, value: number | undefined): number | undefined {
  if (value == null) return current;
  return (current ?? 0) + numberOrZero(value);
}

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
      const revenue = numberOrZero(c.revenue);
      const enrollCount = numberOrZero(c.enrollCount);
      const existing = map.get(c.courseId);

      if (existing) {
        existing.allTime += revenue;
        existing.enrollCount += enrollCount;
        existing.grossRevenue = addIfPresent(existing.grossRevenue, c.grossRevenue);
        existing.platformFeeAmount = addIfPresent(
          existing.platformFeeAmount,
          c.platformFeeAmount,
        );
        existing.withholdingBaseAmount = addIfPresent(
          existing.withholdingBaseAmount,
          c.withholdingBaseAmount,
        );
        existing.vatAmount = addIfPresent(existing.vatAmount, c.vatAmount);
        existing.pitAmount = addIfPresent(existing.pitAmount, c.pitAmount);
        existing.taxAmount = addIfPresent(existing.taxAmount, c.taxAmount);
        existing.netRevenue = addIfPresent(existing.netRevenue, c.netRevenue);
        existing.platformFeePercent ??= c.platformFeePercent;
        existing.vatPercent ??= c.vatPercent;
        existing.pitPercent ??= c.pitPercent;
        existing.taxPercent ??= c.taxPercent;
      } else {
        map.set(c.courseId, {
          courseId: c.courseId,
          courseName: c.courseName,
          allTime: revenue,
          thisMonth: 0,
          lastMonth: 0,
          grossRevenue: c.grossRevenue,
          platformFeePercent: c.platformFeePercent,
          platformFeeAmount: c.platformFeeAmount,
          withholdingBaseAmount: c.withholdingBaseAmount,
          vatPercent: c.vatPercent,
          vatAmount: c.vatAmount,
          pitPercent: c.pitPercent,
          pitAmount: c.pitAmount,
          taxPercent: c.taxPercent,
          taxAmount: c.taxAmount,
          netRevenue: c.netRevenue,
          enrollCount,
          growthPercent: null,
        });
      }
    }
  }

  return Array.from(map.values()).map(enrichCourseRevenue).sort((a, b) => {
    return (b.netRevenue ?? b.allTime) - (a.netRevenue ?? a.allTime);
  });
}


async function fetchSummaryByRange(
  from?: string,
  to?: string,
): Promise<RevenueSummary> {
  const courses = await fetchCourseRevenueByRange(from, to);
  const totals = courses.reduce(
    (acc, course) => ({
      allTime: roundCurrency(acc.allTime + numberOrZero(course.allTime)),
      grossRevenue: roundCurrency(acc.grossRevenue + numberOrZero(course.grossRevenue ?? course.allTime)),
      platformFeeAmount: roundCurrency(acc.platformFeeAmount + numberOrZero(course.platformFeeAmount)),
      withholdingBaseAmount: roundCurrency(
        acc.withholdingBaseAmount + numberOrZero(course.withholdingBaseAmount),
      ),
      vatAmount: roundCurrency(acc.vatAmount + numberOrZero(course.vatAmount)),
      pitAmount: roundCurrency(acc.pitAmount + numberOrZero(course.pitAmount)),
      taxAmount: roundCurrency(acc.taxAmount + numberOrZero(course.taxAmount)),
      netRevenue: roundCurrency(acc.netRevenue + numberOrZero(course.netRevenue)),
    }),
    {
      allTime: 0,
      grossRevenue: 0,
      platformFeeAmount: 0,
      withholdingBaseAmount: 0,
      vatAmount: 0,
      pitAmount: 0,
      taxAmount: 0,
      netRevenue: 0,
    },
  );

  return enrichSummary({
    allTime: totals.allTime,
    thisMonth: 0,
    lastMonth: 0,
    grossRevenue: totals.grossRevenue,
    platformFeePercent: PLATFORM_FEE_RATE,
    platformFeeAmount: totals.platformFeeAmount,
    withholdingBaseAmount: totals.withholdingBaseAmount,
    vatPercent: INSTRUCTOR_VAT_WITHHOLDING_PERCENT,
    vatAmount: totals.vatAmount,
    pitPercent: INSTRUCTOR_PIT_WITHHOLDING_PERCENT,
    pitAmount: totals.pitAmount,
    taxPercent: roundCurrency(
      INSTRUCTOR_VAT_WITHHOLDING_PERCENT + INSTRUCTOR_PIT_WITHHOLDING_PERCENT,
    ),
    taxAmount: totals.taxAmount,
    annualTaxExemptThreshold: INSTRUCTOR_TAX_EXEMPT_ANNUAL_REVENUE_VND,
    netRevenue: totals.netRevenue,
    growthPercent: null,
    courses,
  });
}
export const instructorRevenueApi = {
  getSummary: async (): Promise<RevenueSummary> => {
    const { data } = await apiHttpClient.get<RevenueSummary>(
      "/instructor/revenue/summary",
    );
    return enrichSummary(data);
  },

  getSummaryByRange: fetchSummaryByRange,

  getTimeseries: async (
    params?: RevenueTimeseriesParams,
  ): Promise<TimeseriesItem[]> => {
    const { data } = await apiHttpClient.get<TimeseriesItem[]>(
      "/instructor/revenue/timeseries",
      { params },
    );
    return data.map(enrichTimeseriesItem);
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
    const items = (data.items ?? []).map(enrichSaleItem);
    const totalRevenue = roundCurrency(items.reduce((sum, item) => sum + item.price, 0));
    const breakdown = calculateBreakdown(totalRevenue);

    return {
      ...data,
      totalRevenue: data.totalRevenue ?? totalRevenue,
      platformFeePercent: data.platformFeePercent ?? breakdown.platformFeePercent,
      platformFeeAmount: data.platformFeeAmount ?? breakdown.platformFeeAmount,
      withholdingBaseAmount: data.withholdingBaseAmount ?? breakdown.withholdingBaseAmount,
      vatPercent: data.vatPercent ?? breakdown.vatPercent,
      vatAmount: data.vatAmount ?? breakdown.vatAmount,
      pitPercent: data.pitPercent ?? breakdown.pitPercent,
      pitAmount: data.pitAmount ?? breakdown.pitAmount,
      taxPercent: data.taxPercent ?? breakdown.taxPercent,
      taxAmount: data.taxAmount ?? breakdown.taxAmount,
      netRevenue: data.netRevenue ?? breakdown.netRevenue,
      totalItems: data.totalItems ?? items.length,
      items,
    };
  },
};
