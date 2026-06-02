"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import type { TimeseriesItem } from "../../revenue/types";

const chartConfig = {
  revenue: { label: "Doanh thu", color: "var(--primary)" },
} satisfies ChartConfig;

function formatVND(amount: number): string {
  if (amount >= 1_000_000)
    return `${(amount / 1_000_000).toFixed(amount % 1_000_000 === 0 ? 0 : 1)}tr`;
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

interface Props {
  data: TimeseriesItem[];
  isLoading?: boolean;
}

export function RevenueChart({ data, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="flex h-[240px] items-center justify-center">
        <div className="flex gap-1.5 items-end h-24">
          {[40, 70, 50, 90, 60, 80, 45].map((h, i) => (
            <div
              key={i}
              className="w-7 animate-pulse rounded-t-md bg-muted"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex h-[240px] flex-col items-center justify-center gap-2 text-center">
        <p className="text-sm font-medium text-muted-foreground">Chưa có dữ liệu</p>
        <p className="text-xs text-muted-foreground/60">
          Chọn khoảng thời gian hoặc chờ giao dịch đầu tiên
        </p>
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
            tickFormatter={formatVND}
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
            width={52}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)", opacity: 0.4 }}
            formatter={(value: number) => [
              `${value.toLocaleString("vi-VN")} ₫`,
              "Doanh thu",
            ]}
            labelFormatter={formatDateLabel}
            contentStyle={{
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              fontSize: "12px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            }}
          />
          <Bar
            dataKey="revenue"
            fill="var(--primary)"
            radius={[4, 4, 0, 0]}
            maxBarSize={48}
            opacity={0.9}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
