"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import type { CourseStudentsDataPoint } from "../../types";

const chartConfig = {
  students: { label: "Học viên", color: "var(--primary)" },
} satisfies ChartConfig;

interface Props {
  data: CourseStudentsDataPoint[];
}

export function StudentsByCourseChart({ data }: Props) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-5">
      <h3 className="mb-4 text-sm font-semibold">Học viên theo khóa học</h3>
      <ChartContainer config={chartConfig} className="h-[180px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
          >
            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="courseName"
              width={90}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(value: number) => [value, "Học viên"]}
              contentStyle={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                fontSize: "12px",
              }}
            />
            <Bar
              dataKey="students"
              fill="var(--primary)"
              radius={[0, 4, 4, 0]}
              opacity={0.85}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
