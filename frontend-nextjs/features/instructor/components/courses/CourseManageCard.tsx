"use client";

import Link from "next/link";
import {
  BookOpen,
  Layers3,
  Trash2,
  FolderKanban,
  Clock3,
  Languages,
  BadgeCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type {
  InstructorCourse,
  CourseStatus,
} from "../../course-management/types";

interface Props {
  course: InstructorCourse;
  onDelete: (id: number) => void;
}

function StatusBadge({ status }: { status: CourseStatus }) {
  const config: Record<CourseStatus, { label: string; className: string }> = {
    publish: {
      label: "Published",
      className:
        "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400",
    },
    draft: { label: "Draft", className: "bg-muted text-muted-foreground" },
    pending: {
      label: "Pending",
      className:
        "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400",
    },
    approved: {
      label: "Approved",
      className:
        "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
    },
    rejected: {
      label: "Rejected",
      className: "bg-destructive/10 text-destructive",
    },
  };
  const { label, className } = config[status];
  return (
    <Badge variant="outline" className={cn("text-[11px]", className)}>
      {label}
    </Badge>
  );
}

export function CourseManageCard({ course, onDelete }: Props) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-linear-to-b from-background via-background to-muted/20 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg">
      <div className="h-1 w-full bg-linear-to-r from-primary/70 via-amber-400/70 to-primary/20" />

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="line-clamp-1 font-semibold">{course.name}</h3>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {course.description}
            </p>
          </div>
          <StatusBadge status={course.status} />
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {course.categories.slice(0, 3).map((category) => (
            <Badge key={category} variant="secondary" className="text-[11px]">
              {category}
            </Badge>
          ))}
        </div>

        <div className="mt-auto grid gap-2 rounded-xl border border-border/60 bg-background/70 p-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock3 className="h-3.5 w-3.5" />
            {course.duration}
          </span>
          <span className="flex items-center gap-1">
            <Languages className="h-3.5 w-3.5" />
            {course.language}
          </span>
          <span className="flex items-center gap-1">
            <BadgeCheck className="h-3.5 w-3.5" />
            {course.level}
          </span>
          <span className="flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5" />
            {course.price.toLocaleString("vi-VN")}đ
          </span>
        </div>

        <div className="mt-4 grid gap-2">
          <Button size="sm" className="w-full gap-1.5" asChild>
            <Link href={`/instructor/courses/${course.id}`}>
              <FolderKanban className="h-3.5 w-3.5" />
              Quản lý khóa học
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 gap-1.5"
              asChild
            >
              <Link href={`/instructor/courses/${course.id}/lessons`}>
                <Layers3 className="h-3.5 w-3.5" />
                Bài học
              </Link>
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 border-destructive/30 p-0 text-destructive hover:bg-destructive/5 hover:text-destructive"
              onClick={() => onDelete(course.id)}
              aria-label="Xóa khóa học"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
