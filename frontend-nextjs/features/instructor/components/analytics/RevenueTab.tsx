"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRevenueSummaryByRange, useRevenueTimeseries } from "../../revenue/hooks";
import { useCourseStatsOverview } from "../../analytics/hooks";
import type { RevenueTimeseriesParams } from "../../revenue/types";
import { RevenueSummaryCards } from "./RevenueSummaryCards";
import { RevenueChart } from "./RevenueChart";
import { CourseRevenueTable } from "./CourseRevenueTable";

// ── Types ──────────────────────────────────────────────────────────────────────

type PresetKey = "7d" | "30d" | "thisMonth" | "3m" | "1y" | "all" | "custom";

interface Preset {
  key: PresetKey;
  label: string;
  defaultGranularity: RevenueTimeseriesParams["granularity"];
}

const PRESETS: Preset[] = [
  { key: "7d",        label: "7 ngày",    defaultGranularity: "daily"   },
  { key: "30d",       label: "30 ngày",   defaultGranularity: "daily"   },
  { key: "thisMonth", label: "Tháng này", defaultGranularity: "daily"   },
  { key: "3m",        label: "3 tháng",   defaultGranularity: "weekly"  },
  { key: "1y",        label: "Năm nay",   defaultGranularity: "monthly" },
  { key: "all",       label: "12 tháng gần nhất",   defaultGranularity: "monthly" },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function toDateStr(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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
  const from = new Date(today);
  from.setMonth(from.getMonth() - 11);
  from.setDate(1);
  return { from: toDateStr(from), to: todayStr };
}

function getPresetLabel(preset: PresetKey, from?: string, to?: string): string {
  if (preset === "7d") return "7 ngày qua";
  if (preset === "30d") return "30 ngày qua";
  if (preset === "thisMonth") return "Tháng này";
  if (preset === "3m") return "3 tháng qua";
  if (preset === "1y") return "Năm nay";
  if (preset === "all") return "12 tháng gần nhất";
  if (from && to) return `${from} → ${to}`;
  if (from) return `Từ ${from}`;
  if (to) return `Đến ${to}`;
  return "Tùy chỉnh";
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
  const presetButtonRefs = useRef<Partial<Record<PresetKey, HTMLButtonElement | null>>>({});
  const [granularity, setGranularity] =
    useState<RevenueTimeseriesParams["granularity"]>("monthly");
  const [showCustom, setShowCustom] = useState(false);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [appliedFrom, setAppliedFrom] = useState<string | undefined>(
    () => getPresetRange("all").from,
  );
  const [appliedTo, setAppliedTo] = useState<string | undefined>(
    () => getPresetRange("all").to,
  );

  const { data: summary, isLoading: summaryLoading } = useRevenueSummaryByRange(appliedFrom, appliedTo);
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

  const chartData = useMemo(
    () => timeseries.map((item) => ({ ...item, revenue: item.netRevenue ?? item.revenue })),
    [timeseries],
  );

  const appliedLabel = getPresetLabel(activePreset, appliedFrom, appliedTo);
  const customDateInvalid = Boolean(customFrom && customTo && customFrom > customTo);
  const vatPercent = summary?.vatPercent ?? 5;
  const pitPercent = summary?.pitPercent ?? 2;
  const vatTreatmentLabel =
    vatPercent === 0 ? "GTGT không chịu thuế" : `GTGT ${vatPercent}%`;
  const pitWithholdingLabel = `TNCN ${pitPercent}%`;

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

  const [toolbarSlot, setToolbarSlot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const activeButton = presetButtonRefs.current[activePreset];
    if (!activeButton) return;

    const frame = window.requestAnimationFrame(() => {
      activeButton.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [activePreset, toolbarSlot]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {
        setToolbarSlot(document.getElementById("analytics-revenue-toolbar-slot"));
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const revenueToolbar = (
    <div className="rounded-lg bg-transparent px-1 py-1">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 gap-2">
          <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">Khoảng thời gian</p>
            <p className="text-xs text-muted-foreground">
              Áp dụng cho biểu đồ và thu nhập theo khoá
            </p>
          </div>
        </div>
        <div className="relative -mx-3 flex snap-x scroll-px-3 items-center gap-1.5 overflow-x-auto px-3 pb-1 pr-12 [-ms-overflow-style:none] [scrollbar-width:none] after:pointer-events-none after:sticky after:right-0 after:h-11 after:w-8 after:shrink-0 after:bg-linear-to-l after:from-background after:to-transparent [&::-webkit-scrollbar]:hidden lg:mx-0 lg:flex-wrap lg:justify-end lg:overflow-visible lg:px-0 lg:pb-0 lg:after:hidden">
          {PRESETS.map((preset) => (
            <button
              key={preset.key}
              type="button"
              ref={(node) => {
                presetButtonRefs.current[preset.key] = node;
              }}
              onClick={() => handlePresetClick(preset)}
              className={`h-11 shrink-0 snap-start rounded-md px-3 text-xs font-medium transition-all ${
                activePreset === preset.key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {preset.label}
            </button>
          ))}

          <button
            type="button"
            onClick={() => setShowCustom((v) => !v)}
            className={`inline-flex h-11 shrink-0 snap-start items-center gap-1.5 rounded-md px-3 text-xs font-medium transition-all ${
              activePreset === "custom"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <CalendarDays className="h-3 w-3" />
            Tùy chỉnh
          </button>

          {activePreset === "custom" && (
            <button
              type="button"
              onClick={handleResetAll}
              className="inline-flex h-11 shrink-0 snap-start items-center gap-1 rounded-md px-2.5 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-3 w-3" />
              Xoá lọc
            </button>
          )}
        </div>
      </div>

      {showCustom && (
        <div className="mt-3 flex flex-wrap items-end gap-3 rounded-lg border border-dashed border-border/50 bg-transparent px-3 py-3">
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
  );

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <>
      {toolbarSlot ? createPortal(revenueToolbar, toolbarSlot) : null}
      <div className="space-y-4">
      {/* ── KPI summary ── */}
      <div className="overflow-hidden rounded-xl border border-border/60 bg-background shadow-sm">
        <RevenueSummaryCards data={summary} isLoading={summaryLoading} />
        <div className="flex gap-2 border-t border-border/40 bg-primary/5 px-4 py-2.5 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          <p>
            Tạm khấu trừ thuế: {vatTreatmentLabel} · {pitWithholdingLabel} · Ngưỡng doanh thu năm: 1 tỷ đồng.
          </p>
        </div>
      </div>

      {/* ── Biểu đồ thu nhập ── */}
      <div className="overflow-hidden rounded-xl border border-border/60 bg-background shadow-sm">
        <div className="flex items-center justify-between border-b border-border/40 px-4 py-3">
          <span className="text-sm font-semibold">Biểu đồ thu nhập</span>
          {activePreset !== "all" && <PeriodBadge label={appliedLabel} />}
        </div>
        <div className="px-4 pb-5 pt-3">
          <RevenueChart
            data={chartData}
            isLoading={chartLoading}
            showBrush={chartData.length > 18}
          />
        </div>
      </div>

      {/* ── Thu nhập theo khoá học ── */}
      <div className="overflow-hidden rounded-xl border border-border/60 bg-background shadow-sm">
        <div className="flex items-center justify-between border-b border-border/40 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">Thu nhập theo khoá học</span>
            {activePreset !== "all" && <PeriodBadge label={appliedLabel} />}
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
    </>
  );
}
