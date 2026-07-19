"use client";

import { useState, useMemo } from "react";
import { AlertTriangle, CalendarDays, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRevenueSummary, useRevenueTimeseries } from "../../revenue/hooks";
import { useCourseStatsOverview } from "../../analytics/hooks";
import type { RevenueGranularity, RevenueTimeseriesParams } from "../../revenue/types";
import { RevenueSummaryCards } from "./RevenueSummaryCards";
import { RevenueChart } from "./RevenueChart";
import { CourseRevenueTable } from "./CourseRevenueTable";

// ── Types ──────────────────────────────────────────────────────────────────────

type PresetKey = "7d" | "30d" | "thisMonth" | "3m" | "1y" | "all" | "custom";

interface Preset {
  key: PresetKey;
  label: string;
  defaultGranularity: RevenueGranularity;
}

const PRESETS: Preset[] = [
  { key: "7d",        label: "7 ngày",    defaultGranularity: "daily"   },
  { key: "30d",       label: "30 ngày",   defaultGranularity: "daily"   },
  { key: "thisMonth", label: "Tháng này", defaultGranularity: "daily"   },
  { key: "3m",        label: "3 tháng",   defaultGranularity: "weekly"  },
  { key: "1y",        label: "Năm nay",   defaultGranularity: "monthly" },
  { key: "all",       label: "Tất cả",    defaultGranularity: "monthly" },
];

const GRANULARITY_OPTIONS: { label: string; value: RevenueGranularity }[] = [
  { label: "Ngày", value: "daily" },
  { label: "Tuần", value: "weekly" },
  { label: "Tháng", value: "monthly" },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function getPresetRange(key: PresetKey): { from: string; to: string } {
  const today = new Date();
  const todayStr = toDateStr(today);

  if (key === "7d") {
    const from = new Date(today);
    from.setDate(from.getDate() - 6);
    return { from: toDateStr(from), to: todayStr };
  }
  if (key === "30d") {
    const from = new Date(today);
    from.setDate(from.getDate() - 29);
    return { from: toDateStr(from), to: todayStr };
  }
  if (key === "thisMonth") {
    const from = new Date(today.getFullYear(), today.getMonth(), 1);
    return { from: toDateStr(from), to: todayStr };
  }
  if (key === "3m") {
    const from = new Date(today);
    from.setMonth(from.getMonth() - 3);
    return { from: toDateStr(from), to: todayStr };
  }
  if (key === "1y") {
    const from = new Date(today.getFullYear(), 0, 1);
    return { from: toDateStr(from), to: todayStr };
  }
  return { from: "2020-01-01", to: todayStr };
}

function getPresetLabel(preset: PresetKey, from?: string, to?: string): string {
  if (preset === "7d") return "7 ngày qua";
  if (preset === "30d") return "30 ngày qua";
  if (preset === "thisMonth") return "Tháng này";
  if (preset === "3m") return "3 tháng qua";
  if (preset === "1y") return "Năm nay";
  if (preset === "all") return "Tất cả";
  if (from && to) return `${from} → ${to}`;
  if (from) return `Từ ${from}`;
  if (to) return `Đến ${to}`;
  return "Tùy chỉnh";
}

// ── Sub-components ─────────────────────────────────────────────────────────────

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
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function PeriodBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
      <CalendarDays className="h-3 w-3" />
      {label}
    </span>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function RevenueTab() {
  const [activePreset, setActivePreset] = useState<PresetKey>("all");
  const [granularity, setGranularity] = useState<RevenueGranularity>("monthly");
  const [showCustom, setShowCustom] = useState(false);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [appliedFrom, setAppliedFrom] = useState<string | undefined>(
    () => getPresetRange("all").from,
  );
  const [appliedTo, setAppliedTo] = useState<string | undefined>(
    () => getPresetRange("all").to,
  );

  const { data: summary, isLoading: summaryLoading } = useRevenueSummary();
  const { data: statsOverview } = useCourseStatsOverview();
  const { data: timeseries = [], isLoading: chartLoading } = useRevenueTimeseries({
    granularity,
    from: appliedFrom,
    to: appliedTo,
  } satisfies RevenueTimeseriesParams);

  const ratingMap = useMemo(
    () =>
      new Map(
        (statsOverview?.courses ?? []).map((c) => [c.courseId, c.ratings.averageRating]),
      ),
    [statsOverview],
  );

  const enrichedCourses = useMemo(
    () =>
      (summary?.courses ?? []).map((c) => ({
        ...c,
        avgRating: ratingMap.get(c.courseId) ?? null,
      })),
    [summary, ratingMap],
  );

  const appliedLabel = getPresetLabel(activePreset, appliedFrom, appliedTo);
  const customDateInvalid = Boolean(customFrom && customTo && customFrom > customTo);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  function handlePresetClick(preset: Preset) {
    setActivePreset(preset.key);
    setShowCustom(false);
    setCustomFrom("");
    setCustomTo("");
    const range = getPresetRange(preset.key);
    setAppliedFrom(range.from);
    setAppliedTo(range.to);
    setGranularity(preset.defaultGranularity);
  }

  function handleApplyCustom() {
    if ((!customFrom && !customTo) || customDateInvalid) return;
    setAppliedFrom(customFrom || undefined);
    setAppliedTo(customTo || undefined);
    setActivePreset("custom");
    setShowCustom(false);
  }

  function handleCancelCustom() {
    setShowCustom(false);
    if (activePreset === "custom" && !appliedFrom && !appliedTo) {
      setActivePreset("all");
    }
  }

  function handleResetAll() {
    const range = getPresetRange("all");
    setActivePreset("all");
    setGranularity("monthly");
    setShowCustom(false);
    setCustomFrom("");
    setCustomTo("");
    setAppliedFrom(range.from);
    setAppliedTo(range.to);
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/25 dark:text-amber-100">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Thông tin doanh thu chỉ dành cho giảng viên sở hữu khóa học. Các số
          liệu hiện là doanh thu ghi nhận từ giao dịch thành công; khi hệ thống
          áp dụng phí nền tảng N%, cần trừ phần phí này trước khi đối soát cho
          giảng viên.
        </p>
      </div>

      {/* ── KPI summary ── */}
      <div className="overflow-hidden rounded-xl border border-border/60 bg-background shadow-sm">
        <RevenueSummaryCards data={summary} isLoading={summaryLoading} />
      </div>

      {/* ── Filter (áp dụng cho cả biểu đồ lẫn bảng khoá học) ── */}
      <div className="rounded-xl border border-border/60 bg-background shadow-sm">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 px-4 py-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">Khoảng thời gian</span>
            <span className="hidden text-[11px] text-muted-foreground/50 sm:inline">
              — áp dụng cho biểu đồ và doanh thu theo khoá
            </span>
          </div>
          <GranularitySelector value={granularity} onChange={setGranularity} />
        </div>

        {/* Preset chips + custom panel */}
        <div className="space-y-3 px-4 py-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {PRESETS.map((preset) => (
              <button
                key={preset.key}
                type="button"
                onClick={() => handlePresetClick(preset)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                  activePreset === preset.key
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {preset.label}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setShowCustom((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all ${
                activePreset === "custom"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <CalendarDays className="h-3 w-3" />
              Tùy chỉnh
            </button>

            {/* Reset khi đang dùng custom */}
            {activePreset === "custom" && (
              <button
                type="button"
                onClick={handleResetAll}
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
                Xoá lọc
              </button>
            )}
          </div>

          {/* Custom date picker */}
          {showCustom && (
            <div className="flex flex-wrap items-end gap-3 rounded-xl border border-dashed border-border bg-muted/20 px-3 py-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-medium text-muted-foreground">Từ ngày</span>
                <Input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="h-8 w-36 border-border/60 bg-background px-2 text-xs"
                />
              </div>
              <span className="mb-1.5 text-muted-foreground">→</span>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-medium text-muted-foreground">Đến ngày</span>
                <Input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="h-8 w-36 border-border/60 bg-background px-2 text-xs"
                />
              </div>
              {customDateInvalid && (
                <p className="w-full text-[11px] text-destructive">
                  Ngày bắt đầu phải trước ngày kết thúc
                </p>
              )}
              <div className="ml-auto flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="default"
                  className="h-8 px-3 text-xs"
                  disabled={(!customFrom && !customTo) || customDateInvalid}
                  onClick={handleApplyCustom}
                >
                  Áp dụng
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 px-2 text-xs text-muted-foreground"
                  onClick={handleCancelCustom}
                >
                  Hủy
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Biểu đồ doanh thu ── */}
      <div className="overflow-hidden rounded-xl border border-border/60 bg-background shadow-sm">
        <div className="flex items-center justify-between border-b border-border/40 px-4 py-3">
          <span className="text-sm font-semibold">Biểu đồ doanh thu</span>
          <PeriodBadge label={appliedLabel} />
        </div>
        <div className="px-4 pb-5 pt-3">
          <RevenueChart
            data={timeseries}
            isLoading={chartLoading}
            showBrush={activePreset === "all" || activePreset === "1y"}
          />
        </div>
      </div>

      {/* ── Doanh thu theo khoá học ── */}
      <div className="overflow-hidden rounded-xl border border-border/60 bg-background shadow-sm">
        <div className="flex items-center justify-between border-b border-border/40 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">Doanh thu theo khoá học</span>
            <PeriodBadge label={appliedLabel} />
          </div>
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
