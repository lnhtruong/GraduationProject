"use client";

import { TrendingUp, TrendingDown, Minus, DollarSign, Calendar, History } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { RevenueSummary } from "../../revenue/types";

function formatVND(amount: number): string {
  return `${amount.toLocaleString("vi-VN")}đ`;
}

function GrowthBadge({ value }: { value: number | null }) {
  if (value === null) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
        <Minus className="h-3 w-3" />
        Không có dữ liệu tháng trước
      </span>
    );
  }
  const positive = value >= 0;
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-medium ${
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
      {value.toFixed(1)}% so với tháng trước
    </span>
  );
}

interface Props {
  data: RevenueSummary | undefined;
  isLoading: boolean;
}

export function RevenueSummaryCards({ data, isLoading }: Props) {
  const cards = [
    {
      label: "Tổng thu nhập",
      value: data ? formatVND(data.allTime) : "—",
      icon: DollarSign,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      extra: null,
    },
    {
      label: "Tháng này",
      value: data ? formatVND(data.thisMonth) : "—",
      icon: Calendar,
      iconBg: "bg-emerald-50 dark:bg-emerald-950/30",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      extra: data ? <GrowthBadge value={data.growthPercent} /> : null,
    },
    {
      label: "Tháng trước",
      value: data ? formatVND(data.lastMonth) : "—",
      icon: History,
      iconBg: "bg-blue-50 dark:bg-blue-950/30",
      iconColor: "text-blue-600 dark:text-blue-400",
      extra: null,
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 divide-y divide-border/40 border-b border-border/40 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-5">
            <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
            <div className="space-y-1.5">
              <Skeleton className="h-6 w-28" />
              <Skeleton className="h-3.5 w-20" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 divide-y divide-border/40 border-b border-border/40 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
      {cards.map(({ label, value, icon: Icon, iconBg, iconColor, extra }) => (
        <div key={label} className="flex items-start gap-4 p-5">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg}`}
          >
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
          <div className="min-w-0">
            <p className="text-xl font-bold tabular-nums leading-tight">{value}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
            {extra && <div className="mt-1">{extra}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}
