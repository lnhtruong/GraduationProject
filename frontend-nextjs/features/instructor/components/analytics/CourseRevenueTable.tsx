"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronUp, ChevronDown, ChevronsUpDown, BookOpen, Star, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useRevenueCoursesByRange } from "../../revenue/hooks";
import type { CourseRevenueSummary } from "../../revenue/types";
import { TransactionItemsDrawer } from "./TransactionItemsDrawer";

function formatVND(amount: number): string {
  if (amount >= 1_000_000)
    return `${(amount / 1_000_000).toFixed(amount % 1_000_000 === 0 ? 0 : 1)}tr ₫`;
  if (amount >= 1_000) return `${Math.round(amount / 1_000)}k ₫`;
  return `${amount.toLocaleString("vi-VN")} ₫`;
}

const THUMB_COLORS = [
  "bg-blue-500",
  "bg-violet-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-pink-500",
  "bg-indigo-500",
];

function courseColor(courseId: number): string {
  return THUMB_COLORS[courseId % THUMB_COLORS.length];
}

function CourseThumb({
  courseId,
  courseName,
  thumbnailUrl,
}: {
  courseId: number;
  courseName: string;
  thumbnailUrl?: string | null;
}) {
  if (thumbnailUrl) {
    return (
      <div className="relative h-9 w-16 shrink-0 overflow-hidden rounded-md">
        <Image
          src={thumbnailUrl}
          alt={courseName}
          fill
          sizes="64px"
          className="object-cover"
        />
      </div>
    );
  }
  return (
    <div
      className={`flex h-9 w-16 shrink-0 items-center justify-center rounded-md text-xs font-bold text-white ${courseColor(courseId)}`}
    >
      {courseName.charAt(0).toUpperCase()}
    </div>
  );
}

function RatingBadge({ value }: { value: number | null | undefined }) {
  if (value == null) {
    return <span className="text-xs text-muted-foreground/40">—</span>;
  }
  return (
    <span className="inline-flex items-center gap-0.5 tabular-nums">
      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
      <span>{value.toFixed(1)}</span>
    </span>
  );
}

type SortKey = "allTime" | "enrollCount";
type SortDir = "asc" | "desc";

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ChevronsUpDown className="ml-1 inline h-3 w-3 opacity-30" />;
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
  const [drawerCourse, setDrawerCourse] = useState<{ courseId: number; courseName: string } | null>(null);

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
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <Skeleton className="h-9 w-16 rounded-md" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-10" />
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
      return ranged
        ? { ...base, ...ranged }
        : { ...base, allTime: 0, enrollCount: 0, growthPercent: null };
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
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/40">
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                Khoá học
              </th>
              <Th sortKey="allTime" current={sortKey} dir={sortDir} onSort={handleSort}>
                Doanh thu
              </Th>
              <Th sortKey="enrollCount" current={sortKey} dir={sortDir} onSort={handleSort}>
                Học viên
              </Th>
              <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">
                Đánh giá
              </th>
              <th className="w-6" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((course) => {
              const isZero = course.allTime === 0;
              const pct = maxRevenue > 0 ? (course.allTime / maxRevenue) * 100 : 0;
              return (
                <tr
                  key={course.courseId}
                  onClick={() => setDrawerCourse({ courseId: course.courseId, courseName: course.courseName })}
                  className={`group cursor-pointer border-b border-border/30 transition-colors hover:bg-muted/20 last:border-0 ${isZero ? "opacity-60" : ""}`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <CourseThumb
                        courseId={course.courseId}
                        courseName={course.courseName}
                        thumbnailUrl={course.thumbnailUrl}
                      />
                      <div className="flex min-w-0 flex-col gap-1">
                        <p className="max-w-[260px] truncate font-medium leading-tight">
                          {course.courseName}
                        </p>
                        <div className="h-1 w-full max-w-[260px] rounded-full bg-muted/50">
                          <div
                            className="h-1 rounded-full bg-primary/50 transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    <span className="font-semibold">{formatVND(course.allTime)}</span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                    {course.enrollCount}
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                    <RatingBadge value={course.avgRating} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ChevronRight className="ml-auto h-3.5 w-3.5 text-muted-foreground/40 transition-colors group-hover:text-muted-foreground" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <TransactionItemsDrawer
        course={drawerCourse}
        from={from}
        to={to}
        onClose={() => setDrawerCourse(null)}
      />
    </>
  );
}
