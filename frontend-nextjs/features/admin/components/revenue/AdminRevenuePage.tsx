"use client";

import { useState } from "react";
import {
  BarChart3,
  Search,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
  BookOpen,
  CalendarDays,
  X,
  AlertTriangle,
  RefreshCw,
  ChevronRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { useAdminRevenueSummary, useAdminRevenueTimeseries } from "../../revenue/hooks";
import type { RevenueGranularity, CourseRevenueSummary, TimeseriesItem } from "../../revenue/types";
import { AdminTransactionItemsDrawer, type AdminTransactionDrawerCourse } from "./AdminTransactionItemsDrawer";

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

const chartConfig = {
  revenue: { label: "Doanh thu", color: "var(--primary)" },
} satisfies ChartConfig;

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatVND(amount: number): string {
  if (amount >= 1_000_000)
    return `${(amount / 1_000_000).toFixed(amount % 1_000_000 === 0 ? 0 : 1)}tr ₫`;
  if (amount >= 1_000) return `${Math.round(amount / 1_000)}k ₫`;
  return `${amount.toLocaleString("vi-VN")} ₫`;
}

function formatVNDShort(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}tr`;
  if (amount >= 1_000) return `${Math.round(amount / 1_000)}k`;
  return String(amount);
}

function formatDateLabel(date: string): string {
  const weekly = date.match(/^(\d{4})-W(\d{1,2})$/);
  if (weekly) return `T${weekly[2]}`;
  const monthly = date.match(/^(\d{4})-(\d{2})$/);
  if (monthly) return `Th${parseInt(monthly[2])}`;
  const daily = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (daily) return `${daily[3]}/${daily[2]}`;
  return date;
}

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function getPresetRange(key: PresetKey): { from: string; to: string } {
  const today = new Date();
  const todayStr = toDateStr(today);
  if (key === "7d") {
    const from = new Date(today); from.setDate(from.getDate() - 6);
    return { from: toDateStr(from), to: todayStr };
  }
  if (key === "30d") {
    const from = new Date(today); from.setDate(from.getDate() - 29);
    return { from: toDateStr(from), to: todayStr };
  }
  if (key === "thisMonth") {
    const from = new Date(today.getFullYear(), today.getMonth(), 1);
    return { from: toDateStr(from), to: todayStr };
  }
  if (key === "3m") {
    const from = new Date(today); from.setMonth(from.getMonth() - 3);
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
  return "Tùy chỉnh";
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function GrowthBadge({ percent }: { percent: number | null }) {
  if (percent === null) return <span className="text-xs text-muted-foreground">—</span>;
  if (percent === 0)
    return (
      <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
        <Minus className="h-3 w-3" /> 0%
      </span>
    );
  const positive = percent > 0;
  return (
    <span className={`flex items-center gap-0.5 text-xs font-medium ${positive ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
      {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {positive ? "+" : ""}{percent.toFixed(1)}%
    </span>
  );
}

function GranularitySelector({ value, onChange }: { value: RevenueGranularity; onChange: (v: RevenueGranularity) => void }) {
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

function SummaryCards({ data, isLoading }: { data: ReturnType<typeof useAdminRevenueSummary>["data"]; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-px bg-border/30 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="space-y-2 bg-background px-5 py-4">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-28" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    );
  }
  const courseCount = data?.courses.length ?? 0;
  return (
    <div className="grid grid-cols-2 gap-px bg-border/30 sm:grid-cols-4">
      {[
        { label: "Tổng doanh thu", value: data ? formatVND(data.allTime) : "—", sub: null, accent: true },
        { label: "Tháng này", value: data ? formatVND(data.thisMonth) : "—", sub: data ? <GrowthBadge percent={data.growthPercent} /> : null, accent: false },
        { label: "Tháng trước", value: data ? formatVND(data.lastMonth) : "—", sub: <span className="text-[11px] text-muted-foreground/50">kỳ trước đó</span>, accent: false },
        {
          label: "Khoá đang bán",
          value: String(courseCount),
          sub: <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/60"><BookOpen className="h-3 w-3" />có doanh thu</span>,
          accent: false,
        },
      ].map((card) => (
        <div key={card.label} className="bg-background px-5 py-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{card.label}</p>
          <p className={`mt-1 text-2xl font-bold tabular-nums leading-none ${card.accent ? "text-primary" : ""}`}>{card.value}</p>
          {card.sub && <div className="mt-1.5">{card.sub}</div>}
        </div>
      ))}
    </div>
  );
}

function RevenueChartSection({ data, isLoading }: { data: TimeseriesItem[]; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="flex h-[240px] items-center justify-center">
        <div className="flex h-24 items-end gap-1.5">
          {[40, 70, 50, 90, 60, 80, 45].map((h, i) => (
            <div key={i} className="w-7 animate-pulse rounded-t-md bg-muted" style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>
    );
  }
  if (data.length === 0) {
    return (
      <div className="flex h-[240px] flex-col items-center justify-center gap-2 text-center">
        <p className="text-sm font-medium text-muted-foreground">Chưa có dữ liệu</p>
        <p className="text-xs text-muted-foreground/60">Chưa có giao dịch trong khoảng thời gian này</p>
      </div>
    );
  }
  return (
    <ChartContainer config={chartConfig} className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatDateLabel}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatVNDShort}
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
            width={52}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)", opacity: 0.4 }}
            formatter={(value: number) => [`${value.toLocaleString("vi-VN")} ₫`, "Doanh thu"]}
            labelFormatter={formatDateLabel}
            contentStyle={{
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              fontSize: "12px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            }}
          />
          <Bar dataKey="revenue" fill="var(--primary)" radius={[4, 4, 0, 0]} maxBarSize={48} opacity={0.9} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

function CourseTable({
  courses,
  onSelectCourse,
}: {
  courses: CourseRevenueSummary[];
  onSelectCourse: (course: AdminTransactionDrawerCourse) => void;
}) {
  if (courses.length === 0) {
    return (
      <div className="py-12 text-center">
        <BookOpen className="mx-auto mb-3 h-8 w-8 opacity-25" />
        <p className="text-sm text-muted-foreground">Chưa có khoá học nào có doanh thu</p>
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/60 bg-muted/40">
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Khoá học</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Tổng doanh thu</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Tháng này</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Tháng trước</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Đã bán</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Tăng trưởng</th>
            <th className="w-6" />
          </tr>
        </thead>
        <tbody>
          {courses.map((course) => (
            <tr
              key={course.courseId}
              onClick={() => onSelectCourse({ courseId: course.courseId, courseName: course.courseName })}
              className="group cursor-pointer border-b border-border/40 transition-colors hover:bg-muted/30"
            >
              <td className="px-4 py-3">
                <p className="font-medium leading-snug">{course.courseName}</p>
                <p className="text-[11px] text-muted-foreground">ID: {course.courseId}</p>
              </td>
              <td className="px-4 py-3 text-right font-medium tabular-nums">{formatVND(course.allTime)}</td>
              <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{formatVND(course.thisMonth)}</td>
              <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{formatVND(course.lastMonth)}</td>
              <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{course.soldCount}</td>
              <td className="px-4 py-3 text-right">
                <GrowthBadge percent={course.growthPercent} />
              </td>
              <td className="px-4 py-3 text-right">
                <ChevronRight className="ml-auto h-3.5 w-3.5 text-muted-foreground/40 transition-colors group-hover:text-muted-foreground" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Step 1: User Picker ────────────────────────────────────────────────────────

interface UserPickerProps {
  onSelect: (userId: number) => void;
}

function UserPicker({ onSelect }: UserPickerProps) {
  const [input, setInput] = useState("");
  const parsed = parseInt(input, 10);
  const isValid = !isNaN(parsed) && parsed > 0 && String(parsed) === input.trim();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isValid) onSelect(parsed);
  }

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <BarChart3 className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-lg font-semibold">Tra doanh thu giảng viên</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Nhập User ID của giảng viên cần đối soát doanh thu
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              inputMode="numeric"
              placeholder="Nhập User ID (ví dụ: 42)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="pl-9 text-center"
              autoFocus
            />
          </div>
          {input.trim() && !isValid && (
            <p className="text-xs text-destructive">User ID phải là số nguyên dương</p>
          )}
          <Button type="submit" className="w-full" disabled={!isValid}>
            Xem doanh thu
          </Button>
        </form>

        <p className="text-[11px] text-muted-foreground/60">
          Tính năng tìm kiếm theo email sẽ được hỗ trợ khi backend cung cấp API
        </p>
      </div>
    </div>
  );
}

// ── Step 2: Revenue Dashboard ──────────────────────────────────────────────────

interface RevenueDashboardProps {
  userId: number;
  onBack: () => void;
}

function RevenueDashboard({ userId, onBack }: RevenueDashboardProps) {
  const [drawerCourse, setDrawerCourse] = useState<AdminTransactionDrawerCourse | null>(null);
  const [activePreset, setActivePreset] = useState<PresetKey>("all");
  const [granularity, setGranularity] = useState<RevenueGranularity>("monthly");
  const [showCustom, setShowCustom] = useState(false);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [appliedFrom, setAppliedFrom] = useState<string>(() => getPresetRange("all").from);
  const [appliedTo, setAppliedTo] = useState<string>(() => getPresetRange("all").to);

  const { data: summary, isLoading: summaryLoading, isError: summaryError, refetch } =
    useAdminRevenueSummary(userId);
  const { data: timeseries = [], isLoading: chartLoading } = useAdminRevenueTimeseries(userId, {
    granularity,
    from: appliedFrom,
    to: appliedTo,
  });

  const appliedLabel = getPresetLabel(activePreset, appliedFrom, appliedTo);
  const customDateInvalid = Boolean(customFrom && customTo && customFrom > customTo);

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
    setAppliedFrom(customFrom || getPresetRange("all").from);
    setAppliedTo(customTo || getPresetRange("all").to);
    setActivePreset("custom");
    setShowCustom(false);
  }

  if (summaryError) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 text-center">
        <AlertTriangle className="h-10 w-10 text-destructive" />
        <div>
          <p className="font-semibold">Không thể tải dữ liệu doanh thu</p>
          <p className="mt-1 text-sm text-muted-foreground">User ID {userId} có thể không tồn tại hoặc chưa có doanh thu</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Thử lại
          </Button>
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Chọn user khác
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 border-b border-border/50 pb-5">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <BarChart3 className="h-5 w-5 text-primary" />
            Đối soát doanh thu
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            User ID: <span className="font-medium text-foreground">{userId}</span>
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="mr-2 h-3.5 w-3.5" />
          Chọn user khác
        </Button>
      </div>

      {/* Summary cards */}
      <div className="overflow-hidden rounded-xl border border-border/60 bg-background shadow-sm">
        <SummaryCards data={summary} isLoading={summaryLoading} />
      </div>

      {/* Date filter */}
      <div className="rounded-xl border border-border/60 bg-background shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 px-4 py-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">Khoảng thời gian</span>
          </div>
          <GranularitySelector value={granularity} onChange={setGranularity} />
        </div>

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
            {activePreset === "custom" && (
              <button
                type="button"
                onClick={() => handlePresetClick(PRESETS.find((p) => p.key === "all")!)}
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
                Xoá lọc
              </button>
            )}
          </div>

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
                <p className="w-full text-[11px] text-destructive">Ngày bắt đầu phải trước ngày kết thúc</p>
              )}
              <div className="ml-auto flex items-center gap-1.5">
                <Button
                  size="sm"
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
                  onClick={() => setShowCustom(false)}
                >
                  Hủy
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="overflow-hidden rounded-xl border border-border/60 bg-background shadow-sm">
        <div className="flex items-center justify-between border-b border-border/40 px-4 py-3">
          <span className="text-sm font-semibold">Biểu đồ doanh thu</span>
          <PeriodBadge label={appliedLabel} />
        </div>
        <div className="px-4 pb-5 pt-3">
          <RevenueChartSection data={timeseries} isLoading={chartLoading} />
        </div>
      </div>

      {/* Course table */}
      <div className="overflow-hidden rounded-xl border border-border/60 bg-background shadow-sm">
        <div className="flex items-center justify-between border-b border-border/40 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">Doanh thu theo khoá học</span>
          </div>
          {!summaryLoading && summary && summary.courses.length > 0 && (
            <span className="rounded bg-muted/60 px-1.5 py-0.5 text-[11px] text-muted-foreground">
              {summary.courses.length} khoá
            </span>
          )}
        </div>
        {summaryLoading ? (
          <div className="space-y-0">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 border-b border-border/40 px-4 py-3">
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 w-48 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-16 animate-pulse rounded bg-muted" />
                </div>
                <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                <div className="h-4 w-20 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
        ) : (
          <CourseTable courses={summary?.courses ?? []} onSelectCourse={setDrawerCourse} />
        )}
      </div>

      <AdminTransactionItemsDrawer
        userId={userId}
        course={drawerCourse}
        from={appliedFrom}
        to={appliedTo}
        onClose={() => setDrawerCourse(null)}
      />
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────

export default function AdminRevenuePage() {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  return (
    <div className="space-y-6">
      {selectedUserId === null ? (
        <UserPicker onSelect={setSelectedUserId} />
      ) : (
        <RevenueDashboard userId={selectedUserId} onBack={() => setSelectedUserId(null)} />
      )}
    </div>
  );
}
