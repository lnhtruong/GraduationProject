import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { LecturerRequestStatus } from "../types/lecturer-request.types";

const STATUS_CONFIG: Record<
  LecturerRequestStatus,
  { label: string; className: string }
> = {
  pending: {
    label: "Chờ duyệt",
    className:
      "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400",
  },
  approved: {
    label: "Đã duyệt",
    className:
      "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400",
  },
  rejected: {
    label: "Từ chối",
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
};

export function LecturerRequestStatusBadge({
  status,
}: {
  status: LecturerRequestStatus;
}) {
  const { label, className } = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return (
    <Badge variant="outline" className={cn("text-[11px] font-medium", className)}>
      {label}
    </Badge>
  );
}
