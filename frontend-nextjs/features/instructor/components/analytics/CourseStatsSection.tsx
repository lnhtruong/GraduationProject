"use client";

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

interface Props {
  courses: CourseStatItem[];
  isLoading: boolean;
}

export function CourseStatsSection({ courses, isLoading }: Props) {
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
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/20 hover:bg-muted/20">
          <TableHead className="pl-5 font-medium text-muted-foreground">Khóa học</TableHead>
          <TableHead className="font-medium text-muted-foreground">Tổng HV</TableHead>
          <TableHead className="font-medium text-muted-foreground">Đang học</TableHead>
          <TableHead className="font-medium text-muted-foreground">Hoàn thành</TableHead>
          <TableHead className="font-medium text-muted-foreground">Tỉ lệ HT</TableHead>
          <TableHead className="font-medium text-muted-foreground">Tiến độ TB</TableHead>
          <TableHead className="font-medium text-muted-foreground">Đánh giá</TableHead>
          <TableHead className="pr-5 font-medium text-muted-foreground">Điểm TB</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {courses.map((course) => (
          <TableRow key={course.courseId} className="border-border/40">
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
  );
}
