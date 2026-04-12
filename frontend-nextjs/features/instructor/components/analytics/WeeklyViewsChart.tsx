"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import type { WeeklyDataPoint } from "../../types";

const chartConfig = {
  views: { label: "Views", color: "var(--primary)" },
  students: { label: "Students", color: "var(--chart-2)" },
} satisfies ChartConfig;

interface Props {
  data: WeeklyDataPoint[];
}

export function WeeklyViewsChart({ data }: Props) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-5">
      <h3 className="mb-4 text-sm font-semibold">
        Lượt xem & Học viên theo tuần
      </h3>
      <ChartContainer config={chartConfig} className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="week"
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                fontSize: "12px",
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
            />
            <Line
              type="monotone"
              dataKey="views"
              stroke="var(--primary)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="students"
              stroke="var(--chart-2)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
