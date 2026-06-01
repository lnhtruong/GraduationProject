"use client";

import { useState } from "react";
import {
  BookOpen,
  Users,
  Star,
  TrendingUp,
  Eye,
  Heart,
  Flame,
  CheckCircle2,
  DollarSign,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  useCourseStatsOverview,
  useFeedCreatorStats,
  useFeedTrending,
} from "../../analytics/hooks";
import { useRevenueSummary } from "../../revenue/hooks";
import { CourseStatsSection } from "./CourseStatsSection";
import { FeedStatsSection } from "./FeedStatsSection";
import { TrendingFeedSection } from "./TrendingFeedSection";
import { RevenueTab } from "./RevenueTab";
import type { StatPeriod } from "../../analytics/types";

// ── Period selector ───────────────────────────────────────────────────────────

const PERIOD_OPTIONS: { label: string; value: StatPeriod }[] = [
  { label: "7 ngày", value: "7d" },
  { label: "30 ngày", value: "30d" },
  { label: "Tất cả", value: "all" },
];

function PeriodSelector({
  value,
  onChange,
}: {
  value: StatPeriod;
  onChange: (v: StatPeriod) => void;
}) {
  return (
    <div className="flex items-center rounded-lg border border-border/60 bg-muted/30 p-0.5">
      {PERIOD_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            value === opt.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ── Summary stat card ─────────────────────────────────────────────────────────

interface SummaryCardProps {
  label: string;
  value: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
}

function SummaryCard({ label, value, icon: Icon, iconBg, iconColor }: SummaryCardProps) {
  return (
    <div className="flex items-center gap-3 p-4">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </div>
      <div className="min-w-0">
        <p className="text-lg font-bold tabular-nums leading-tight">{value}</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function SummaryCardSkeleton() {
  return (
    <div className="flex items-center gap-3 p-4">
      <Skeleton className="h-9 w-9 shrink-0 rounded-xl" />
      <div className="min-w-0 space-y-1.5">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

// ── Tab section summary cards ─────────────────────────────────────────────────

interface TabSummaryRowProps {
  items: SummaryCardProps[];
  isLoading: boolean;
  cols?: number;
}

function TabSummaryRow({ items, isLoading, cols = 4 }: TabSummaryRowProps) {
  const gridClass =
    cols === 3
      ? "grid-cols-1 sm:grid-cols-3"
      : "grid-cols-2 lg:grid-cols-4";

  return (
    <div
      className={`grid ${gridClass} divide-x divide-y divide-border/40 overflow-hidden rounded-xl border border-border/60 bg-background shadow-sm sm:divide-y-0`}
    >
      {isLoading
        ? Array.from({ length: cols }).map((_, i) => <SummaryCardSkeleton key={i} />)
        : items.map((item) => <SummaryCard key={item.label} {...item} />)}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<StatPeriod>("all");
  const [activeTab, setActiveTab] = useState("courses");

  const { data: courseStats, isLoading: courseLoading } = useCourseStatsOverview();
  const { data: feedStats, isLoading: feedLoading } = useFeedCreatorStats(period);
  const { data: trending, isLoading: trendingLoading } = useFeedTrending(period);
  const { data: revenueSummary, isLoading: revenueLoading } = useRevenueSummary();

  const courseSummary = courseStats?.summary;
  const feedSummary = feedStats?.summary;
  const totalEngagements = feedSummary
    ? feedSummary.likes + feedSummary.saves + feedSummary.shares + feedSummary.comments
    : 0;

  function formatVND(amount: number): string {
    return `${amount.toLocaleString("vi-VN")}đ`;
  }

  // ── KPI strip data ──────────────────────────────────────────────────────────
  const kpiItems = [
    {
      label: "Tổng khóa học",
      value: courseLoading ? "—" : String(courseSummary?.totalCourses ?? 0),
      icon: BookOpen,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      isLoading: courseLoading,
    },
    {
      label: "Tổng học viên",
      value: courseLoading
        ? "—"
        : (courseSummary?.totalEnrollments ?? 0).toLocaleString("vi-VN"),
      icon: Users,
      iconBg: "bg-blue-50 dark:bg-blue-950/30",
      iconColor: "text-blue-600 dark:text-blue-400",
      isLoading: courseLoading,
    },
    {
      label: "Doanh thu tháng này",
      value: revenueLoading ? "—" : formatVND(revenueSummary?.thisMonth ?? 0),
      icon: DollarSign,
      iconBg: "bg-emerald-50 dark:bg-emerald-950/30",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      isLoading: revenueLoading,
    },
    {
      label: "Lượt xem Feed",
      value: feedLoading
        ? "—"
        : (feedSummary?.views ?? 0).toLocaleString("vi-VN"),
      icon: Eye,
      iconBg: "bg-violet-50 dark:bg-violet-950/30",
      iconColor: "text-violet-600 dark:text-violet-400",
      isLoading: feedLoading,
    },
    {
      label: "Tổng tương tác",
      value: feedLoading ? "—" : totalEngagements.toLocaleString("vi-VN"),
      icon: Heart,
      iconBg: "bg-rose-50 dark:bg-rose-950/30",
      iconColor: "text-rose-500 dark:text-rose-400",
      isLoading: feedLoading,
    },
  ];

  const globalLoading = courseLoading || feedLoading || revenueLoading;

  return (
    <div className="space-y-5">
      {/* ── Gradient stripe ── */}
      <div className="h-1 rounded-full bg-linear-to-r from-primary/80 via-amber-400/70 to-primary/20" />

      {/* ── Header ── */}
      <div className="border-b border-border/50 pb-4">
        <h1 className="text-xl font-bold tracking-tight">Thống kê</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Tổng quan hiệu suất khóa học và nội dung Shorts Feed
        </p>
      </div>

      {/* ── KPI summary strip ── */}
      <div className="grid grid-cols-2 divide-x divide-y divide-border/40 overflow-hidden rounded-xl border border-border/60 bg-background shadow-sm sm:grid-cols-3 lg:grid-cols-5 lg:divide-y-0">
        {globalLoading
          ? Array.from({ length: 5 }).map((_, i) => <SummaryCardSkeleton key={i} />)
          : kpiItems.map((item) => <SummaryCard key={item.label} {...item} />)}
      </div>

      {/* ── Tabs ── */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        {/* TabsList + PeriodSelector row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList className="h-9 rounded-lg bg-muted/50 p-0.5">
            <TabsTrigger value="courses" className="h-8 gap-1.5 rounded-md px-3 text-sm">
              <BookOpen className="h-3.5 w-3.5" />
              Khóa học
            </TabsTrigger>
            <TabsTrigger value="feed" className="h-8 gap-1.5 rounded-md px-3 text-sm">
              <TrendingUp className="h-3.5 w-3.5" />
              Shorts Feed
            </TabsTrigger>
            <TabsTrigger value="trending" className="h-8 gap-1.5 rounded-md px-3 text-sm">
              <Flame className="h-3.5 w-3.5" />
              Trending
            </TabsTrigger>
            <TabsTrigger value="revenue" className="h-8 gap-1.5 rounded-md px-3 text-sm">
              <DollarSign className="h-3.5 w-3.5" />
              Thu nhập
            </TabsTrigger>
          </TabsList>

          {activeTab !== "revenue" && (
            <PeriodSelector value={period} onChange={setPeriod} />
          )}
        </div>

        {/* ── Tab: Khóa học ── */}
        <TabsContent value="courses" className="mt-0 space-y-4">
          <TabSummaryRow
            isLoading={courseLoading}
            items={[
              {
                label: "Tổng khóa học",
                value: String(courseSummary?.totalCourses ?? 0),
                icon: BookOpen,
                iconBg: "bg-primary/10",
                iconColor: "text-primary",
              },
              {
                label: "Tổng học viên",
                value: (courseSummary?.totalEnrollments ?? 0).toLocaleString("vi-VN"),
                icon: Users,
                iconBg: "bg-blue-50 dark:bg-blue-950/30",
                iconColor: "text-blue-600 dark:text-blue-400",
              },
              {
                label: "Tỉ lệ hoàn thành",
                value: `${courseSummary?.completionRate ?? 0}%`,
                icon: CheckCircle2,
                iconBg: "bg-emerald-50 dark:bg-emerald-950/30",
                iconColor: "text-emerald-600 dark:text-emerald-400",
              },
              {
                label: "Điểm đánh giá TB",
                value: `${courseSummary?.averageRating ?? 0} ★`,
                icon: Star,
                iconBg: "bg-amber-50 dark:bg-amber-950/30",
                iconColor: "text-amber-500 dark:text-amber-400",
              },
            ]}
          />
          <div className="overflow-hidden rounded-xl border border-border/60 bg-background shadow-sm">
            <CourseStatsSection
              courses={courseStats?.courses ?? []}
              isLoading={courseLoading}
            />
          </div>
        </TabsContent>

        {/* ── Tab: Shorts Feed ── */}
        <TabsContent value="feed" className="mt-0 space-y-4">
          <TabSummaryRow
            isLoading={feedLoading}
            items={[
              {
                label: "Tổng bài đăng",
                value: String(feedSummary?.totalFeeds ?? 0),
                icon: TrendingUp,
                iconBg: "bg-primary/10",
                iconColor: "text-primary",
              },
              {
                label: "Tổng lượt xem",
                value: (feedSummary?.views ?? 0).toLocaleString("vi-VN"),
                icon: Eye,
                iconBg: "bg-blue-50 dark:bg-blue-950/30",
                iconColor: "text-blue-600 dark:text-blue-400",
              },
              {
                label: "Tổng tương tác",
                value: totalEngagements.toLocaleString("vi-VN"),
                icon: Heart,
                iconBg: "bg-rose-50 dark:bg-rose-950/30",
                iconColor: "text-rose-500 dark:text-rose-400",
              },
              {
                label: "Tỉ lệ hoàn thành",
                value: `${feedSummary?.completionRate ?? 0}%`,
                icon: CheckCircle2,
                iconBg: "bg-emerald-50 dark:bg-emerald-950/30",
                iconColor: "text-emerald-600 dark:text-emerald-400",
              },
            ]}
          />
          <div className="overflow-hidden rounded-xl border border-border/60 bg-background shadow-sm">
            <FeedStatsSection
              feeds={feedStats?.data ?? []}
              isLoading={feedLoading}
            />
          </div>
        </TabsContent>

        {/* ── Tab: Trending ── */}
        <TabsContent value="trending" className="mt-0">
          <div className="overflow-hidden rounded-xl border border-border/60 bg-background shadow-sm">
            <TrendingFeedSection
              items={trending?.data ?? []}
              isLoading={trendingLoading}
            />
          </div>
        </TabsContent>

        {/* ── Tab: Thu nhập ── */}
        <TabsContent value="revenue" className="mt-0">
          <RevenueTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
