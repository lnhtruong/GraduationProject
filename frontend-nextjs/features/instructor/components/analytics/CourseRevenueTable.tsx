"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown, BookOpen } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useRevenueCoursesByRange } from "../../revenue/hooks";
import type { CourseRevenueSummary } from "../../revenue/types";

function formatVND(amount: number): string {
  if (amount >= 1_000_000)
    return `${(amount / 1_000_000).toFixed(amount % 1_000_000 === 0 ? 0 : 1)}tr ₫`;
  if (amount >= 1_000) return `${Math.round(amount / 1_000)}k ₫`;
  return `${amount.toLocaleString("vi-VN")} ₫`;
}

type SortKey = "allTime" | "enrollCount";
type SortDir = "asc" | "desc";

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active)
    return <ChevronsUpDown className="ml-1 inline h-3 w-3 opacity-30" />;
  return dir === "desc" ? (
    <ChevronDown className="ml-1 inline h-3 w-3" />
  ) : (
    <ChevronUp className="ml-1 inline h-3 w-3" />
  );
}

function Th({
  children,
  sortKey,
  current,
  dir,
  onSort,
  align = "right",
}: {
  children: React.ReactNode;
  sortKey: SortKey;
  current: SortKey;
  dir: SortDir;
  onSort: (k: SortKey) => void;
  align?: "left" | "right";
}) {
  return (
    <th
      className={`cursor-pointer select-none px-4 py-2.5 text-${align} text-xs font-medium text-muted-foreground hover:text-foreground`}
      onClick={() => onSort(sortKey)}
    >
      {children}
      <SortIcon active={current === sortKey} dir={dir} />
    </th>
  );
}

interface Props {
  from?: string;
  to?: string;
  allCourses: CourseRevenueSummary[];
}

export function CourseRevenueTable({ from, to, allCourses }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("allTime");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const hasDateRange = Boolean(from && to);
  const { data: rangedCourses = [], isLoading: rangedLoading } =
    useRevenueCoursesByRange(from, to);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const isLoading = hasDateRange ? rangedLoading : allCourses.length === 0;

  if (isLoading) {
    return (
      <div className="divide-y divide-border/40">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-12" />
          </div>
        ))}
      </div>
    );
  }

  let displayCourses: CourseRevenueSummary[];
  if (hasDateRange) {
    const rangedMap = new Map(rangedCourses.map((c) => [c.courseId, c]));
    displayCourses = allCourses.map((base) => {
      const ranged = rangedMap.get(base.courseId);
      return ranged ?? { ...base, allTime: 0, enrollCount: 0, growthPercent: null };
    });
  } else {
    displayCourses = [...allCourses];
  }

  const sorted = [...displayCourses].sort((a, b) => {
    const diff = a[sortKey] - b[sortKey];
    return sortDir === "desc" ? -diff : diff;
  });

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
        <BookOpen className="h-7 w-7 text-muted-foreground/25" />
        <p className="text-sm text-muted-foreground">Chưa có dữ liệu</p>
      </div>
    );
  }

  const maxRevenue = Math.max(...sorted.map((c) => c.allTime), 1);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/40">
            <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
              Khoá học
            </th>
            <Th
              sortKey="allTime"
              current={sortKey}
              dir={sortDir}
              onSort={handleSort}
            >
              Doanh thu
            </Th>
            <Th
              sortKey="enrollCount"
              current={sortKey}
              dir={sortDir}
              onSort={handleSort}
            >
              Học viên
            </Th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((course) => {
            const pct = maxRevenue > 0 ? (course.allTime / maxRevenue) * 100 : 0;
            return (
              <tr
                key={course.courseId}
                className="group border-b border-border/30 transition-colors hover:bg-muted/20 last:border-0"
              >
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <p className="max-w-[300px] truncate font-medium leading-tight">
                      {course.courseName}
                    </p>
                    {/* Revenue bar */}
                    <div className="h-1 w-full max-w-[300px] rounded-full bg-muted/50">
                      <div
                        className="h-1 rounded-full bg-primary/50 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  <span className={`font-semibold ${course.allTime === 0 ? "text-muted-foreground/50" : ""}`}>
                    {formatVND(course.allTime)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                  {course.enrollCount}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
