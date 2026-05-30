"use client";

import { Check, X, Loader2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { CourseStatusBadge } from "../CourseStatusBadge";
import type { Course } from "@/features/courses/types";

const LEVEL_LABELS: Record<string, string> = {
  beginner: "Sơ cấp",
  intermediate: "Trung cấp",
  advanced: "Cao cấp",
};

function formatDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatPrice(price: number) {
  return price === 0 ? "Miễn phí" : `${price.toLocaleString("vi-VN")}đ`;
}

interface Props {
  courses: Course[];
  isLoading?: boolean;
  isFiltering?: boolean;
  showActions?: boolean;
  approvingId?: number | null;
  rejectingId?: number | null;
  onApprove?: (course: Course) => void;
  onReject?: (course: Course) => void;
  onViewDetail?: (course: Course) => void;
}

export function AdminCourseTable({
  courses,
  isLoading,
  isFiltering = false,
  showActions = true,
  approvingId,
  rejectingId,
  onApprove,
  onReject,
  onViewDetail,
}: Props) {
  if (isLoading) {
    return (
      <div className="divide-y divide-border/40 px-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3.5">
            <Skeleton className="h-4 w-[40%]" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="ml-auto h-4 w-20" />
            <Skeleton className="h-7 w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
        <Eye className="h-8 w-8 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">
          {isFiltering ? "Không tìm thấy khóa học phù hợp" : "Không có khóa học nào"}
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/20 hover:bg-muted/20">
          <TableHead className="w-[38%] pl-5 font-medium text-muted-foreground">
            Khóa học
          </TableHead>
          <TableHead className="font-medium text-muted-foreground">Level</TableHead>
          <TableHead className="font-medium text-muted-foreground">Giá</TableHead>
          <TableHead className="font-medium text-muted-foreground">Gửi lúc</TableHead>
          <TableHead className="font-medium text-muted-foreground">Trạng thái</TableHead>
          {showActions && (
            <TableHead className="pr-5 text-right font-medium text-muted-foreground">
              Thao tác
            </TableHead>
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {courses.map((course) => {
          const isApproving = approvingId === course.id;
          const isRejecting = rejectingId === course.id;
          const isBusy = isApproving || isRejecting;

          return (
            <TableRow
              key={course.id}
              className="group cursor-pointer border-border/40 transition-colors hover:bg-primary/[0.03]"
              onClick={() => onViewDetail?.(course)}
            >
              {/* Course name + categories */}
              <TableCell className="py-4 pl-5">
                <p className="line-clamp-1 font-medium leading-snug">
                  {course.name}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {course.categories.slice(0, 2).map((cat) => (
                    <Badge
                      key={cat}
                      variant="secondary"
                      className="h-4 px-1.5 text-[10px] font-normal"
                    >
                      {cat}
                    </Badge>
                  ))}
                  {course.categories.length > 2 && (
                    <span className="text-[10px] text-muted-foreground">
                      +{course.categories.length - 2}
                    </span>
                  )}
                </div>
              </TableCell>

              <TableCell className="text-sm text-muted-foreground">
                {LEVEL_LABELS[course.level.toLowerCase()] ?? course.level}
              </TableCell>

              <TableCell className="text-sm font-medium">
                {formatPrice(course.price)}
              </TableCell>

              <TableCell className="text-sm text-muted-foreground">
                {formatDate(course.created_at)}
              </TableCell>

              <TableCell>
                <CourseStatusBadge status={course.status} />
              </TableCell>

              {showActions && (
                <TableCell className="pr-5" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1.5">
                    {course.status === "pending" ? (
                      <>
                        <Button
                          size="sm"
                          className="h-7 gap-1.5 bg-emerald-600 px-3 text-[12px] font-medium text-white hover:bg-emerald-700"
                          onClick={() => onApprove?.(course)}
                          disabled={isBusy}
                        >
                          {isApproving ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Check className="h-3 w-3" />
                          )}
                          Duyệt
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 gap-1.5 border-destructive/30 px-3 text-[12px] font-medium text-destructive hover:bg-destructive/5 hover:text-destructive"
                          onClick={() => onReject?.(course)}
                          disabled={isBusy}
                        >
                          {isRejecting ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <X className="h-3 w-3" />
                          )}
                          Từ chối
                        </Button>
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground/50">—</span>
                    )}
                  </div>
                </TableCell>
              )}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
