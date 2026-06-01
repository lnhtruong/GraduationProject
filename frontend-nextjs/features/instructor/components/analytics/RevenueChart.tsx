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

// "YYYY-Wxx" → "Tuần xx" | "YYYY-MM" → "Tháng MM" | "YYYY-MM-DD" → "DD/MM"
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
  title?: string;
}

export function RevenueChart({ data, title = "Doanh thu (₫)" }: Props) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-5">
      <h3 className="mb-4 text-sm font-semibold">{title}</h3>
      <ChartContainer config={chartConfig} className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
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
              width={55}
            />
            <Tooltip
              formatter={(value: number) => [
                `${value.toLocaleString("vi-VN")}đ`,
                "Doanh thu",
              ]}
              labelFormatter={formatDateLabel}
              contentStyle={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                fontSize: "12px",
              }}
            />
            <Bar
              dataKey="revenue"
              fill="var(--primary)"
              radius={[4, 4, 0, 0]}
              opacity={0.85}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
