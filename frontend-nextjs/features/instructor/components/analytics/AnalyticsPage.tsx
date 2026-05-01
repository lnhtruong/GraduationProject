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

// ── Summary stat card (simple, no change%) ────────────────────────────────────

function SummaryCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-5">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
        <Icon className={`h-4.5 w-4.5 ${accent ?? "text-primary"}`} />
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="mt-0.5 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function SummaryCardSkeleton() {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-5">
      <Skeleton className="mb-3 h-9 w-9 rounded-lg" />
      <Skeleton className="h-7 w-24" />
      <Skeleton className="mt-1.5 h-4 w-32" />
    </div>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-background shadow-sm">
      <div className="border-b border-border/50 px-5 py-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </p>
      </div>
      {children}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<StatPeriod>("all");

  const {
    data: courseStats,
    isLoading: courseLoading,
  } = useCourseStatsOverview();

  const {
    data: feedStats,
    isLoading: feedLoading,
  } = useFeedCreatorStats(period);

  const {
    data: trending,
    isLoading: trendingLoading,
  } = useFeedTrending(period);

  const courseSummary = courseStats?.summary;
  const feedSummary = feedStats?.summary;
  const totalEngagements = feedSummary
    ? feedSummary.likes + feedSummary.saves + feedSummary.shares + feedSummary.comments
    : 0;

  return (
    <div className="space-y-8">
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
      <div className="space-y-4">
        <h2 className="text-base font-semibold">Khóa học</h2>

        {/* Course summary cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {courseLoading ? (
            Array.from({ length: 4 }).map((_, i) => <SummaryCardSkeleton key={i} />)
          ) : (
            <>
              <SummaryCard
                label="Tổng khóa học"
                value={String(courseSummary?.totalCourses ?? 0)}
                icon={BookOpen}
              />
              <SummaryCard
                label="Tổng học viên"
                value={(courseSummary?.totalEnrollments ?? 0).toLocaleString("vi-VN")}
                icon={Users}
              />
              <SummaryCard
                label="Tỉ lệ hoàn thành"
                value={`${courseSummary?.completionRate ?? 0}%`}
                icon={CheckCircle2}
                accent="text-emerald-600"
              />
              <SummaryCard
                label="Điểm đánh giá TB"
                value={`${courseSummary?.averageRating ?? 0} ★`}
                icon={Star}
                accent="text-amber-500"
              />
            </>
          )}
        </div>

        {/* Course detail table */}
        <SectionCard title="Chi tiết từng khóa học">
          <CourseStatsSection
            courses={courseStats?.courses ?? []}
            isLoading={courseLoading}
          />
        </SectionCard>
      </div>

      {/* ── Section 2: Shorts Feed ── */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold">Shorts Feed</h2>

        {/* Feed summary cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {feedLoading ? (
            Array.from({ length: 4 }).map((_, i) => <SummaryCardSkeleton key={i} />)
          ) : (
            <>
              <SummaryCard
                label="Tổng bài đăng"
                value={String(feedSummary?.totalFeeds ?? 0)}
                icon={TrendingUp}
              />
              <SummaryCard
                label="Tổng lượt xem"
                value={(feedSummary?.views ?? 0).toLocaleString("vi-VN")}
                icon={Eye}
              />
              <SummaryCard
                label="Tổng tương tác"
                value={totalEngagements.toLocaleString("vi-VN")}
                icon={Heart}
                accent="text-rose-500"
              />
              <SummaryCard
                label="Tỉ lệ hoàn thành"
                value={`${feedSummary?.completionRate ?? 0}%`}
                icon={CheckCircle2}
                accent="text-emerald-600"
              />
            </>
          )}
        </div>

        {/* Feed detail table */}
        <SectionCard title="Chi tiết từng feed">
          <FeedStatsSection
            feeds={feedStats?.data ?? []}
            isLoading={feedLoading}
          />
        </SectionCard>
      </div>

      {/* ── Section 3: Trending ── */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold">
          <span className="inline-flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-500" />
            Trending
          </span>
        </h2>

        <SectionCard title={`Top Shorts Feed — ${period === "7d" ? "7 ngày" : period === "30d" ? "30 ngày" : "Tất cả"}`}>
          <TrendingFeedSection
            items={trending?.data ?? []}
            isLoading={trendingLoading}
          />
        </SectionCard>
      </div>
    </div>
  );
}
