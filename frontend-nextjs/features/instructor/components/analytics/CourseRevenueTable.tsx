"use client";

import { TrendingUp, TrendingDown, Minus, BookOpen, Receipt } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import type { CourseRevenueSummary } from "../../revenue/types";

function formatVND(amount: number): string {
  return `${amount.toLocaleString("vi-VN")}đ`;
}

function GrowthCell({ value }: { value: number | null }) {
  if (value === null)
    return <span className="text-muted-foreground">—</span>;
  const positive = value >= 0;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium ${
        positive ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"
      }`}
    >
      {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {positive ? "+" : ""}{value.toFixed(1)}%
    </span>
  );
}

interface Props {
  courses: CourseRevenueSummary[];
  isLoading: boolean;
  onViewDetail: (course: CourseRevenueSummary) => void;
}

export function CourseRevenueTable({ courses, isLoading, onViewDetail }: Props) {
  if (isLoading) {
    return (
      <div className="divide-y divide-border/40">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <Skeleton className="h-4 w-4/12" />
            <Skeleton className="h-4 w-2/12" />
            <Skeleton className="h-4 w-2/12" />
            <Skeleton className="h-4 w-2/12" />
            <Skeleton className="h-4 w-1/12 ml-auto" />
          </div>
        ))}
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
        <BookOpen className="h-8 w-8 text-muted-foreground/30" />
        <p className="text-sm font-medium text-muted-foreground">Chưa có khoá học nào</p>
        <p className="text-xs text-muted-foreground/70">
          Doanh thu sẽ hiển thị sau khi có học viên đăng ký
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/40 bg-muted/30">
            <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
              Khoá học
            </th>
            <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">
              Đã bán
            </th>
            <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">
              Tháng trước
            </th>
            <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">
              Tháng này
            </th>
            <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">
              Tổng
            </th>
            <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">
              Tăng trưởng
            </th>
            <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground" />
          </tr>
        </thead>
        <tbody>
          {courses.map((course) => (
            <tr
              key={course.courseId}
              className="border-b border-border/40 transition-colors hover:bg-muted/20"
            >
              <td className="max-w-[200px] px-4 py-3">
                <p className="truncate font-medium">{course.courseName}</p>
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                {course.enrollCount}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                {formatVND(course.lastMonth)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                {formatVND(course.thisMonth)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums font-semibold">
                {formatVND(course.allTime)}
              </td>
              <td className="px-4 py-3 text-right">
                <GrowthCell value={course.growthPercent} />
              </td>
              <td className="px-4 py-3 text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => onViewDetail(course)}
                >
                  <Receipt className="h-3.5 w-3.5" />
                  Chi tiết
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export { Minus };
