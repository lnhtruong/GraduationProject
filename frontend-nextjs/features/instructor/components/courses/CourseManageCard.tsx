"use client";

import Image from "next/image";
import Link from "next/link";
import { BookOpen, Users, Trash2, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { InstructorCourse, CourseStatus } from "../../types";

interface Props {
  course: InstructorCourse;
  onDelete: (id: number) => void;
}

function StatusBadge({ status }: { status: CourseStatus }) {
  const config: Record<CourseStatus, { label: string; className: string }> = {
    publish: {
      label: "Published",
      className: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400",
    },
    draft: { label: "Draft", className: "bg-muted text-muted-foreground" },
    pending: {
      label: "Pending",
      className: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400",
    },
    approved: {
      label: "Approved",
      className: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
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
    <div className="group flex flex-col overflow-hidden rounded-xl border border-border/70 bg-card transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden bg-muted">
        {course.thumbnailUrl ? (
          <Image
            src={course.thumbnailUrl}
            alt={course.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <BookOpen className="h-10 w-10 text-muted-foreground/30" />
          </div>
        )}
        {/* Status badge overlay */}
        <div className="absolute right-2 top-2">
          <StatusBadge status={course.status} />
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="mb-1 line-clamp-1 font-semibold">{course.name}</h3>
        <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
          {course.description}
        </p>

        {/* Stats */}
        <div className="mt-auto flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5" />
            {course.lessonCount} video
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {course.studentCount} học viên
          </span>
        </div>

        {/* Actions */}
        <div className="mt-4 flex items-center gap-2">
          <Button size="sm" className="flex-1 gap-1.5" asChild>
            <Link href={`/instructor/courses/${course.id}/edit`}>
              <Settings className="h-3.5 w-3.5" />
              Quản lý
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
  );
}
