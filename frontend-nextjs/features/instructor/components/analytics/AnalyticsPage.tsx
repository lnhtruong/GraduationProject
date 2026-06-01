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
import {
  useCourseStatsOverview,
  useFeedCreatorStats,
  useFeedTrending,
} from "../../analytics/hooks";
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
    <div className="flex items-center gap-4 p-5">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </div>
      <div className="min-w-0">
        <p className="text-xl font-bold tabular-nums leading-tight">{value}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function SummaryCardSkeleton() {
  return (
    <div className="flex items-center gap-4 p-5">
      <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
      <div className="min-w-0 space-y-1.5">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-3.5 w-28" />
      </div>
    </div>
  );
}

// ── Section wrapper — gom summary cards + table vào 1 card ───────────────────

function SectionHeader({
  label,
  sublabel,
  icon: Icon,
  iconColor,
}: {
  label: string;
  sublabel?: string;
  icon: React.ElementType;
  iconColor: string;
}) {
  return (
    <div className="flex items-center gap-3 border-l-2 border-primary pl-3">
      <Icon className={`h-4 w-4 shrink-0 ${iconColor}`} />
      <div>
        <p className="text-sm font-semibold leading-tight">{label}</p>
        {sublabel && (
          <p className="text-xs text-muted-foreground">{sublabel}</p>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<StatPeriod>("all");

  const { data: courseStats, isLoading: courseLoading } = useCourseStatsOverview();
  const { data: feedStats, isLoading: feedLoading } = useFeedCreatorStats(period);
  const { data: trending, isLoading: trendingLoading } = useFeedTrending(period);

  const courseSummary = courseStats?.summary;
  const feedSummary = feedStats?.summary;
  const totalEngagements = feedSummary
    ? feedSummary.likes + feedSummary.saves + feedSummary.shares + feedSummary.comments
    : 0;

  const periodLabel =
    period === "7d" ? "7 ngày qua" : period === "30d" ? "30 ngày qua" : "tất cả thời gian";

  return (
    <div className="space-y-8">
      {/* ── Gradient stripe ── */}
      <div className="h-1 rounded-full bg-linear-to-r from-primary/80 via-amber-400/70 to-primary/20" />

      {/* ── Header ── */}
      <div className="flex items-end justify-between gap-4 border-b border-border/50 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Thống kê</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Tổng quan hiệu suất khóa học và nội dung Shorts Feed
          </p>
        </div>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      {/* ── Section 1: Khóa học ── */}
      <div className="space-y-3">
        <SectionHeader
          label="Khóa học"
          sublabel={
            courseSummary
              ? `${courseSummary.totalCourses} khóa học · ${courseSummary.totalEnrollments.toLocaleString("vi-VN")} học viên`
              : undefined
          }
          icon={BookOpen}
          iconColor="text-primary"
        />

        <div className="overflow-hidden rounded-xl border border-border/60 bg-background shadow-sm">
          {/* Summary cards row */}
          <div className="grid grid-cols-2 divide-x divide-y divide-border/40 border-b border-border/40 lg:grid-cols-4 lg:divide-y-0">
            {courseLoading ? (
              Array.from({ length: 4 }).map((_, i) => <SummaryCardSkeleton key={i} />)
            ) : (
              <>
                <SummaryCard
                  label="Tổng khóa học"
                  value={String(courseSummary?.totalCourses ?? 0)}
                  icon={BookOpen}
                  iconBg="bg-primary/10"
                  iconColor="text-primary"
                />
                <SummaryCard
                  label="Tổng học viên"
                  value={(courseSummary?.totalEnrollments ?? 0).toLocaleString("vi-VN")}
                  icon={Users}
                  iconBg="bg-blue-50 dark:bg-blue-950/30"
                  iconColor="text-blue-600 dark:text-blue-400"
                />
                <SummaryCard
                  label="Tỉ lệ hoàn thành"
                  value={`${courseSummary?.completionRate ?? 0}%`}
                  icon={CheckCircle2}
                  iconBg="bg-emerald-50 dark:bg-emerald-950/30"
                  iconColor="text-emerald-600 dark:text-emerald-400"
                />
                <SummaryCard
                  label="Điểm đánh giá TB"
                  value={`${courseSummary?.averageRating ?? 0} ★`}
                  icon={Star}
                  iconBg="bg-amber-50 dark:bg-amber-950/30"
                  iconColor="text-amber-500 dark:text-amber-400"
                />
              </>
            )}
          </div>

          {/* Detail table */}
          <CourseStatsSection
            courses={courseStats?.courses ?? []}
            isLoading={courseLoading}
          />
        </div>
      </div>

      {/* ── Section 2: Shorts Feed ── */}
      <div className="space-y-3">
        <SectionHeader
          label="Shorts Feed"
          sublabel={
            feedSummary
              ? `${feedSummary.totalFeeds} bài đăng · ${feedSummary.views.toLocaleString("vi-VN")} lượt xem · ${periodLabel}`
              : undefined
          }
          icon={TrendingUp}
          iconColor="text-primary"
        />

        <div className="overflow-hidden rounded-xl border border-border/60 bg-background shadow-sm">
          {/* Summary cards row */}
          <div className="grid grid-cols-2 divide-x divide-y divide-border/40 border-b border-border/40 lg:grid-cols-4 lg:divide-y-0">
            {feedLoading ? (
              Array.from({ length: 4 }).map((_, i) => <SummaryCardSkeleton key={i} />)
            ) : (
              <>
                <SummaryCard
                  label="Tổng bài đăng"
                  value={String(feedSummary?.totalFeeds ?? 0)}
                  icon={TrendingUp}
                  iconBg="bg-primary/10"
                  iconColor="text-primary"
                />
                <SummaryCard
                  label="Tổng lượt xem"
                  value={(feedSummary?.views ?? 0).toLocaleString("vi-VN")}
                  icon={Eye}
                  iconBg="bg-blue-50 dark:bg-blue-950/30"
                  iconColor="text-blue-600 dark:text-blue-400"
                />
                <SummaryCard
                  label="Tổng tương tác"
                  value={totalEngagements.toLocaleString("vi-VN")}
                  icon={Heart}
                  iconBg="bg-rose-50 dark:bg-rose-950/30"
                  iconColor="text-rose-500 dark:text-rose-400"
                />
                <SummaryCard
                  label="Tỉ lệ hoàn thành"
                  value={`${feedSummary?.completionRate ?? 0}%`}
                  icon={CheckCircle2}
                  iconBg="bg-emerald-50 dark:bg-emerald-950/30"
                  iconColor="text-emerald-600 dark:text-emerald-400"
                />
              </>
            )}
          </div>

          {/* Detail table */}
          <FeedStatsSection
            feeds={feedStats?.data ?? []}
            isLoading={feedLoading}
          />
        </div>
      </div>

      {/* ── Section 3: Trending ── */}
      <div className="space-y-3">
        <SectionHeader
          label="Trending"
          sublabel={`Top Shorts Feed · ${periodLabel}`}
          icon={Flame}
          iconColor="text-orange-500"
        />

        <div className="overflow-hidden rounded-xl border border-border/60 bg-background shadow-sm">
          <TrendingFeedSection
            items={trending?.data ?? []}
            isLoading={trendingLoading}
          />
        </div>
      </div>

      {/* ── Section 4: Thu nhập ── */}
      <div className="space-y-3">
        <SectionHeader
          label="Thu nhập"
          sublabel="Doanh thu từ khoá học và lịch sử giao dịch"
          icon={DollarSign}
          iconColor="text-emerald-600 dark:text-emerald-400"
        />
        <RevenueTab />
      </div>
    </div>
  );
}
