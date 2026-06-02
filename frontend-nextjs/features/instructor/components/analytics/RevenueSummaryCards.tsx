"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { RevenueSummary } from "../../revenue/types";

function formatVND(amount: number): string {
  if (amount >= 1_000_000)
    return `${(amount / 1_000_000).toFixed(amount % 1_000_000 === 0 ? 0 : 1)}tr ₫`;
  if (amount >= 1_000) return `${Math.round(amount / 1_000)}k ₫`;
  return `${amount.toLocaleString("vi-VN")} ₫`;
}

function GrowthBadge({ percent }: { percent: number | null }) {
  if (percent === null)
    return <span className="text-xs text-muted-foreground">—</span>;
  if (percent === 0)
    return (
      <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
        <Minus className="h-3 w-3" /> 0%
      </span>
    );
  const positive = percent > 0;
  return (
    <span
      className={`flex items-center gap-0.5 text-xs font-medium ${
        positive
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-destructive"
      }`}
    >
      {positive ? (
        <TrendingUp className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}
      {positive ? "+" : ""}
      {percent.toFixed(1)}%
    </span>
  );
}

interface MetricProps {
  label: string;
  value: string;
  sub?: React.ReactNode;
  accent?: boolean;
}

function Metric({ label, value, sub, accent }: MetricProps) {
  return (
    <div className="flex flex-col gap-1 px-5 py-4">
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={`text-2xl font-bold tabular-nums leading-none ${
          accent ? "text-primary" : "text-foreground"
        }`}
      >
        {value}
      </p>
      {sub && <div className="mt-0.5">{sub}</div>}
    </div>
  );
}

interface Props {
  data: RevenueSummary | undefined;
  isLoading: boolean;
}

export function RevenueSummaryCards({ data, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 divide-y divide-border/40 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {[0, 1, 2].map((i) => (
          <div key={i} className="px-5 py-4 space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-28" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 divide-y divide-border/40 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
      <Metric
        label="Tổng doanh thu"
        value={data ? formatVND(data.allTime) : "—"}
        accent
      />
      <Metric
        label="Tháng này"
        value={data ? formatVND(data.thisMonth) : "—"}
        sub={
          data && (
            <GrowthBadge percent={data.growthPercent} />
          )
        }
      />
      <Metric
        label="Tháng trước"
        value={data ? formatVND(data.lastMonth) : "—"}
        sub={
          <span className="text-[11px] text-muted-foreground/60">
            so với cùng kỳ
          </span>
        }
      />
    </div>
  );
}
