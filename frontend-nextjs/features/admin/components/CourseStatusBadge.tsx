import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CourseStatus } from "@/features/courses/types";

const STATUS_CONFIG: Record<CourseStatus, { label: string; className: string }> = {
  publish: {
    label: "Đã xuất bản",
    className:
      "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400",
  },
  draft: {
    label: "Bản nháp",
    className: "bg-muted text-muted-foreground",
  },
  pending: {
    label: "Chờ duyệt",
    className:
      "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400",
  },
  approved: {
    label: "Đã duyệt",
    className:
      "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400",
  },
  rejected: {
    label: "Từ chối",
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
};

export function CourseStatusBadge({ status }: { status: CourseStatus }) {
  const { label, className } = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  return (
    <Badge variant="outline" className={cn("text-[11px] font-medium", className)}>
      {label}
    </Badge>
  );
}
