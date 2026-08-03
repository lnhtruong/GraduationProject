"use client";

import { useRouter } from "next/navigation";
import { BookOpen, Star } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import type { CourseStatItem } from "../../analytics/types";

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary/70"
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
      <span className="text-xs tabular-nums text-muted-foreground">{value}%</span>
    </div>
  );
}

function StatPill({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "blue" | "green" | "amber";
}) {
  const toneClass = {
    default: "bg-muted/60 text-foreground",
    blue: "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300",
    green: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300",
  }[tone];

  return (
    <div className={`rounded-lg px-3 py-2 ${toneClass}`}>
      <p className="text-[10px] font-medium uppercase text-current/70">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums">{value}</p>
    </div>
  );
}

interface Props {
  courses: CourseStatItem[];
  isLoading: boolean;
}

export function CourseStatsSection({ courses, isLoading }: Props) {
  const router = useRouter();
  if (isLoading) {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center">
        <BookOpen className="h-8 w-8 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">Chưa có dữ liệu khóa học</p>
      </div>
    );
  }

  return (
    <>
      <div className="divide-y divide-border/50 lg:hidden">
        {courses.map((course) => (
          <button
            key={course.courseId}
            type="button"
            className="block w-full px-4 py-4 text-left transition-colors hover:bg-primary/[0.03]"
            onClick={() => router.push(`/instructor/courses/${course.courseId}`)}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="line-clamp-2 text-sm font-semibold">
                  {course.courseName}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {course.enrollment.total.toLocaleString("vi-VN")} học viên
                </p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-600 dark:bg-amber-950/30 dark:text-amber-300">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                {course.ratings.averageRating.toFixed(1)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <StatPill
                label="Đang học"
                value={course.enrollment.active.toLocaleString("vi-VN")}
                tone="blue"
              />
              <StatPill
                label="Hoàn thành"
                value={course.enrollment.completed.toLocaleString("vi-VN")}
                tone="green"
              />
              <StatPill
                label="Tỉ lệ hoàn thành"
                value={`${course.enrollment.completionRate}%`}
              />
              <StatPill
                label="Tiến độ trung bình"
                value={`${course.enrollment.averageProgress}%`}
              />
            </div>
          </button>
        ))}
      </div>

      <Table className="hidden min-w-[56rem] lg:table">
      <TableHeader>
        <TableRow className="bg-muted/20 hover:bg-muted/20">
          <TableHead className="pl-5 font-medium text-muted-foreground">Khóa học</TableHead>
          <TableHead className="font-medium text-muted-foreground">Tổng học viên</TableHead>
          <TableHead className="font-medium text-muted-foreground">Đang học</TableHead>
          <TableHead className="font-medium text-muted-foreground">Hoàn thành</TableHead>
          <TableHead className="font-medium text-muted-foreground">Tỉ lệ hoàn thành</TableHead>
          <TableHead className="font-medium text-muted-foreground">Tiến độ trung bình</TableHead>
          <TableHead className="font-medium text-muted-foreground">Đánh giá</TableHead>
          <TableHead className="pr-5 font-medium text-muted-foreground">Điểm trung bình</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {courses.map((course) => (
          <TableRow
            key={course.courseId}
            className="cursor-pointer border-border/40 transition-colors hover:bg-primary/[0.03]"
            onClick={() => router.push(`/instructor/courses/${course.courseId}`)}
          >
            <TableCell className="py-3.5 pl-5">
              <p className="line-clamp-1 text-sm font-medium">{course.courseName}</p>
            </TableCell>
            <TableCell className="text-sm font-medium tabular-nums">
              {course.enrollment.total.toLocaleString("vi-VN")}
            </TableCell>
            <TableCell className="text-sm tabular-nums text-blue-600 dark:text-blue-400">
              {course.enrollment.active.toLocaleString("vi-VN")}
            </TableCell>
            <TableCell className="text-sm tabular-nums text-emerald-600 dark:text-emerald-400">
              {course.enrollment.completed.toLocaleString("vi-VN")}
            </TableCell>
            <TableCell>
              <ProgressBar value={course.enrollment.completionRate} />
            </TableCell>
            <TableCell>
              <ProgressBar value={course.enrollment.averageProgress} />
            </TableCell>
            <TableCell className="text-sm tabular-nums text-muted-foreground">
              {course.ratings.totalReviews}
            </TableCell>
            <TableCell className="pr-5">
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-amber-500">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                {course.ratings.averageRating.toFixed(1)}
              </span>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      </Table>
    </>
  );
}
