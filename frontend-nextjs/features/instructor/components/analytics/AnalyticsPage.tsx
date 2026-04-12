"use client";

import { Eye, Users, DollarSign, TrendingUp } from "lucide-react";
import { StatsCard } from "./StatsCard";
import { WeeklyViewsChart } from "./WeeklyViewsChart";
import { RevenueChart } from "./RevenueChart";
import { StudentsByCourseChart } from "./StudentsByCourseChart";
import {
  MOCK_ANALYTICS_STATS,
  MOCK_WEEKLY_DATA,
  MOCK_REVENUE_DATA,
  MOCK_STUDENTS_BY_COURSE,
  formatNumber,
  formatVND,
} from "../../mock-data";

// TODO: Swap sang real API hooks khi backend sẵn sàng:
//   const { data: stats } = useAnalyticsStats();
//   const { data: weekly } = useWeeklyData();
//   const { data: revenue } = useRevenueData();
//   const { data: byCourse } = useStudentsByCourse();

export default function AnalyticsPage() {
  const stats = MOCK_ANALYTICS_STATS;

  const statsCards = [
    {
      label: "Tổng lượt xem",
      value: formatNumber(stats.totalViews.value),
      changePercent: stats.totalViews.changePercent,
      icon: Eye,
    },
    {
      label: "Học viên mới",
      value: formatNumber(stats.newStudents.value),
      changePercent: stats.newStudents.changePercent,
      icon: Users,
    },
    {
      label: "Doanh thu",
      value: formatVND(stats.revenue.value),
      changePercent: stats.revenue.changePercent,
      icon: DollarSign,
    },
    {
      label: "Avg. Conversion",
      value: `${stats.conversionRate.value}%`,
      changePercent: stats.conversionRate.changePercent,
      icon: TrendingUp,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tổng quan hiệu suất nội dung của bạn
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statsCards.map((card) => (
          <StatsCard key={card.label} {...card} />
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <WeeklyViewsChart data={MOCK_WEEKLY_DATA} />
        <RevenueChart data={MOCK_REVENUE_DATA} />
      </div>

      {/* Charts row 2 */}
      <StudentsByCourseChart data={MOCK_STUDENTS_BY_COURSE} />
    </div>
  );
}
