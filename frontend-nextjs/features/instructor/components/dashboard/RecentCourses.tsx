import Link from "next/link";
import Image from "next/image";
import { BookOpen, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "../../mock-data";
import type { InstructorCourse, CourseStatus } from "../../types";

interface Props {
  courses: InstructorCourse[];
}

function StatusBadge({ status }: { status: CourseStatus }) {
  const config: Record<
    CourseStatus,
    { label: string; className: string }
  > = {
    publish: {
      label: "Published",
      className: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400",
    },
    draft: {
      label: "Draft",
      className: "bg-muted text-muted-foreground",
    },
    pending: {
      label: "Pending",
      className: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400",
    },
    approved: {
      label: "Approved",
      className: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400",
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

export function RecentCourses({ courses }: Props) {
  const recent = courses.slice(0, 3);

  return (
    <div className="rounded-xl border border-border/60 bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold">Recent Courses</h2>
        <Link
          href="/instructor/courses"
          className="text-sm text-primary hover:underline"
        >
          View all →
        </Link>
      </div>

      {recent.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <BookOpen className="mb-2 h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Chưa có khóa học nào</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {recent.map((course) => (
            <li key={course.id} className="flex items-start gap-3">
              {/* Thumbnail */}
              <div className="relative h-10 w-14 shrink-0 overflow-hidden rounded-md bg-muted">
                {course.thumbnailUrl ? (
                  <Image
                    src={course.thumbnailUrl}
                    alt={course.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <BookOpen className="h-4 w-4 text-muted-foreground/40" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="truncate text-sm font-medium">{course.name}</p>
                  <StatusBadge status={course.status} />
                </div>
                <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{course.lessonCount} bài học</span>
                  <span>·</span>
                  <span>Cập nhật {formatRelativeTime(course.updatedAt)}</span>
                </div>
              </div>

              {/* Edit link */}
              <Link
                href={`/instructor/courses/${course.id}/edit`}
                className="shrink-0 text-xs font-medium text-primary hover:underline"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
