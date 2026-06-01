"use client";

import { useState } from "react";
import { DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRevenueSummary, useRevenueTimeseries } from "../../revenue/hooks";
import type { CourseRevenueSummary, RevenueGranularity, RevenueTimeseriesParams } from "../../revenue/types";
import { RevenueSummaryCards } from "./RevenueSummaryCards";
import { RevenueChart } from "./RevenueChart";
import { CourseRevenueTable } from "./CourseRevenueTable";
import { CourseTransactionSheet } from "./CourseTransactionSheet";

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
    <div className="flex items-center rounded-lg border border-border/60 bg-muted/30 p-0.5">
      {GRANULARITY_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
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

function toChartTitle(granularity: RevenueGranularity): string {
  if (granularity === "daily") return "Doanh thu theo ngày (₫)";
  if (granularity === "weekly") return "Doanh thu theo tuần (₫)";
  return "Doanh thu theo tháng (₫)";
}

export function RevenueTab() {
  const [granularity, setGranularity] = useState<RevenueGranularity>("daily");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [chartParams, setChartParams] = useState<RevenueTimeseriesParams>({ granularity: "daily" });

  const [selectedCourse, setSelectedCourse] = useState<CourseRevenueSummary | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data: summary, isLoading: summaryLoading } = useRevenueSummary();
  const { data: timeseries = [], isLoading: chartLoading } = useRevenueTimeseries(chartParams);

  const dateRangeInvalid = from && to && from > to;

  function handleApplyChart() {
    if (dateRangeInvalid) return;
    setChartParams({
      granularity,
      from: from || undefined,
      to: to || undefined,
    });
  }

  function handleViewDetail(course: CourseRevenueSummary) {
    setSelectedCourse(course);
    setSheetOpen(true);
  }

  return (
    <>
      <div className="space-y-5">
        {/* Summary cards */}
        <div className="overflow-hidden rounded-xl border border-border/60 bg-background shadow-sm">
          <RevenueSummaryCards data={summary} isLoading={summaryLoading} />
        </div>

        {/* Chart section */}
        <div className="overflow-hidden rounded-xl border border-border/60 bg-background shadow-sm">
          {/* Chart toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 px-4 py-3">
            <p className="text-xs font-semibold text-muted-foreground">Biểu đồ doanh thu</p>
            <div className="flex flex-wrap items-center gap-2">
              <GranularitySelector value={granularity} onChange={setGranularity} />
              <div className="flex items-center gap-1.5">
                <Input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="h-7 w-32 text-xs"
                />
                <span className="text-xs text-muted-foreground">–</span>
                <Input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="h-7 w-32 text-xs"
                />
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                disabled={!!dateRangeInvalid}
                onClick={handleApplyChart}
              >
                Áp dụng
              </Button>
              {(from || to) && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs text-muted-foreground"
                  onClick={() => {
                    setFrom("");
                    setTo("");
                    setChartParams({ granularity });
                  }}
                >
                  Đặt lại
                </Button>
              )}
            </div>
          </div>
          {dateRangeInvalid && (
            <p className="px-4 py-1 text-[11px] text-destructive">
              Ngày bắt đầu phải trước ngày kết thúc
            </p>
          )}
          <div className="p-4">
            {chartLoading ? (
              <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
                Đang tải...
              </div>
            ) : (
              <RevenueChart data={timeseries} title={toChartTitle(granularity)} />
            )}
          </div>
        </div>

        {/* Course revenue table */}
        <div className="overflow-hidden rounded-xl border border-border/60 bg-background shadow-sm">
          <div className="flex items-center justify-between border-b border-border/40 px-4 py-3">
            <p className="text-xs font-semibold text-muted-foreground">
              Doanh thu theo khoá học
            </p>
            {summary && (
              <span className="text-xs text-muted-foreground">
                {summary.courses.length} khoá học
              </span>
            )}
          </div>
          <CourseRevenueTable
            courses={summary?.courses ?? []}
            isLoading={summaryLoading}
            onViewDetail={handleViewDetail}
          />
        </div>
      </div>

      <CourseTransactionSheet
        course={selectedCourse}
        open={sheetOpen}
        onClose={() => {
          setSheetOpen(false);
          setSelectedCourse(null);
        }}
      />
    </>
  );
}

export { DollarSign };
