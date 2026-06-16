"use client";

import { useState } from "react";
import { CalendarDays, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRevenueSummary, useRevenueTimeseries } from "../../revenue/hooks";
import { useCourseStatsOverview } from "../../analytics/hooks";
import type { RevenueGranularity, RevenueTimeseriesParams } from "../../revenue/types";
import { RevenueSummaryCards } from "./RevenueSummaryCards";
import { RevenueChart } from "./RevenueChart";
import { CourseRevenueTable } from "./CourseRevenueTable";

const GRANULARITY_OPTIONS: { label: string; value: RevenueGranularity }[] = [
  { label: "Ngày", value: "daily" },
  { label: "Tuần", value: "weekly" },
  { label: "Tháng", value: "monthly" },
];

function GranularitySelector({
  value,
  onChange,
}: {
  value: RevenueGranularity;
  onChange: (v: RevenueGranularity) => void;
}) {
  return (
    <div className="flex items-center rounded-lg border border-border/60 bg-muted/40 p-0.5">
      {GRANULARITY_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
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

function toChartTitle(granularity: RevenueGranularity): string {
  if (granularity === "daily") return "Theo ngày";
  if (granularity === "weekly") return "Theo tuần";
  return "Theo tháng";
}

export function RevenueTab() {
  const [granularity, setGranularity] = useState<RevenueGranularity>("daily");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [appliedFrom, setAppliedFrom] = useState<string | undefined>(undefined);
  const [appliedTo, setAppliedTo] = useState<string | undefined>(undefined);

  const chartParams: RevenueTimeseriesParams = {
    granularity,
    from: appliedFrom,
    to: appliedTo,
  };

  const { data: summary, isLoading: summaryLoading } = useRevenueSummary();
  const { data: statsOverview } = useCourseStatsOverview();
  const { data: timeseries = [], isLoading: chartLoading } =
    useRevenueTimeseries(chartParams);

  const ratingMap = new Map(
    (statsOverview?.courses ?? []).map((c) => [c.courseId, c.ratings.averageRating]),
  );

  const enrichedCourses = (summary?.courses ?? []).map((c) => ({
    ...c,
    avgRating: ratingMap.get(c.courseId) ?? null,
  }));

  const dateRangeInvalid = Boolean(from && to && from > to);
  const canApply = Boolean(from && to && !dateRangeInvalid);
  const hasFilter = Boolean(appliedFrom || appliedTo || from || to);

  function handleApply() {
    if (!canApply) return;
    setAppliedFrom(from);
    setAppliedTo(to);
  }

  function handleReset() {
    setFrom("");
    setTo("");
    setGranularity("daily");
    setAppliedFrom(undefined);
    setAppliedTo(undefined);
  }

  return (
    <div className="space-y-4">
      {/* ── KPI metrics ── */}
      <div className="overflow-hidden rounded-xl border border-border/60 bg-background shadow-sm">
        <RevenueSummaryCards data={summary} isLoading={summaryLoading} />
      </div>

      {/* ── Revenue chart ── */}
      <div className="overflow-hidden rounded-xl border border-border/60 bg-background shadow-sm">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">Biểu đồ doanh thu</span>
            <span className="rounded bg-muted/60 px-1.5 py-0.5 text-[11px] text-muted-foreground">
              {toChartTitle(granularity)}
            </span>
            {appliedFrom && appliedTo && (
              <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium text-primary">
                {appliedFrom} → {appliedTo}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <GranularitySelector value={granularity} onChange={setGranularity} />

            {/* Date range */}
            <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-muted/30 px-2 py-1">
              <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="h-6 w-28 border-0 bg-transparent p-0 text-xs shadow-none focus-visible:ring-0"
              />
              <span className="text-muted-foreground/60">–</span>
              <Input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="h-6 w-28 border-0 bg-transparent p-0 text-xs shadow-none focus-visible:ring-0"
              />
            </div>

            <Button
              size="sm"
              variant="default"
              className="h-7 px-3 text-xs"
              disabled={!canApply}
              onClick={handleApply}
            >
              Áp dụng
            </Button>

            {hasFilter && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-muted-foreground"
                onClick={handleReset}
                title="Đặt lại"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {dateRangeInvalid && (
          <p className="border-b border-destructive/20 bg-destructive/5 px-4 py-1.5 text-[11px] text-destructive">
            Ngày bắt đầu phải trước ngày kết thúc
          </p>
        )}

        <div className="px-4 pb-4 pt-3">
          <RevenueChart data={timeseries} isLoading={chartLoading} />
        </div>
      </div>

      {/* ── Course breakdown ── */}
      <div className="overflow-hidden rounded-xl border border-border/60 bg-background shadow-sm">
        <div className="flex items-center justify-between border-b border-border/40 px-4 py-3">
          <span className="text-sm font-semibold">Theo khoá học</span>
          {summary && summary.courses.length > 0 && (
            <span className="rounded bg-muted/60 px-1.5 py-0.5 text-[11px] text-muted-foreground">
              {summary.courses.length} khoá
            </span>
          )}
        </div>
        <CourseRevenueTable
          from={appliedFrom}
          to={appliedTo}
          allCourses={enrichedCourses}
        />
      </div>
    </div>
  );
}
