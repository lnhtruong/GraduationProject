"use client";

import {
  Eye, Loader2, Check, X, BookOpen, FileText, HelpCircle,
  Trash2, PlusCircle, PenLine, User, Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { CourseChangeRequest, CourseChangeRequestKind } from "../../types/change-request.types";

// ── Kind config ───────────────────────────────────────────────────────────────

const KIND_CONFIG: Record<
  CourseChangeRequestKind,
  { label: string; icon: React.ReactNode; colorClass: string }
> = {
  "course.update":  { label: "Cập nhật khoá học", icon: <BookOpen className="h-3 w-3" />,   colorClass: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800" },
  "lesson.create":  { label: "Thêm bài học",       icon: <PlusCircle className="h-3 w-3" />, colorClass: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800" },
  "lesson.update":  { label: "Sửa bài học",        icon: <PenLine className="h-3 w-3" />,    colorClass: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-400 dark:border-violet-800" },
  "lesson.delete":  { label: "Xoá bài học",        icon: <Trash2 className="h-3 w-3" />,     colorClass: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800" },
  "quiz.create":    { label: "Thêm quiz",           icon: <PlusCircle className="h-3 w-3" />, colorClass: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800" },
  "quiz.update":    { label: "Sửa quiz",            icon: <PenLine className="h-3 w-3" />,    colorClass: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800" },
  "quiz.delete":    { label: "Xoá quiz",            icon: <Trash2 className="h-3 w-3" />,     colorClass: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800" },
};

const STATUS_CONFIG = {
  pending:  { label: "Chờ duyệt", colorClass: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800" },
  approved: { label: "Đã duyệt",  colorClass: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800" },
  rejected: { label: "Từ chối",   colorClass: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800" },
};

const FIELD_LABELS: Record<string, string> = {
  name: "Tên khoá học", description: "Mô tả", price: "Giá",
  level: "Cấp độ", language: "Ngôn ngữ", categories: "Danh mục",
  title: "Tiêu đề", contentType: "Loại nội dung", duration: "Thời lượng",
};

// ── Inline diff preview ───────────────────────────────────────────────────────

function InlinePreview({ req }: { req: CourseChangeRequest }) {
  const { kind, payload, prevData, changes } = req;

  if (kind === "lesson.delete") {
    const title = (prevData?.title as string) ?? (changes?.[0]?.from as string) ?? null;
    return (
      <span className="inline-flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400">
        <Trash2 className="h-3 w-3 shrink-0" />
        Xoá: <span className="font-medium">{title ?? "—"}</span>
      </span>
    );
  }

  if (kind === "lesson.create" || kind === "quiz.create") {
    const title = (payload?.title as string) ?? (changes?.find((c) => c.field === "title")?.to as string) ?? null;
    return (
      <span className="text-xs text-muted-foreground">
        Tiêu đề: <span className="font-medium text-foreground">{title ?? "—"}</span>
      </span>
    );
  }

  const diffs = changes ?? [];
  if (diffs.length === 0) return <span className="text-xs text-muted-foreground">—</span>;

  return (
    <span className="flex flex-wrap gap-x-3 gap-y-1">
      {diffs.slice(0, 3).map((c) => {
        const label = FIELD_LABELS[c.field] ?? c.field;
        const fromStr = c.from !== null && c.from !== undefined ? String(c.from) : null;
        const toStr   = c.to   !== null && c.to   !== undefined ? String(c.to)   : null;
        return (
          <span key={c.field} className="inline-flex items-baseline gap-1 text-xs">
            <span className="font-medium text-muted-foreground">{label}:</span>
            {fromStr !== null && (
              <span className="line-through text-muted-foreground/60 max-w-20 truncate inline-block">{fromStr}</span>
            )}
            {fromStr !== null && toStr !== null && <span className="text-muted-foreground/40">→</span>}
            {toStr !== null && (
              <span className="text-foreground max-w-25 truncate inline-block">{toStr}</span>
            )}
          </span>
        );
      })}
      {diffs.length > 3 && (
        <span className="text-xs text-muted-foreground/60">+{diffs.length - 3} trường khác</span>
      )}
    </span>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// ── List ──────────────────────────────────────────────────────────────────────

interface Props {
  requests: CourseChangeRequest[];
  isLoading?: boolean;
  isFiltering?: boolean;
  approvingId?: number | null;
  rejectingId?: number | null;
  onApprove?: (req: CourseChangeRequest) => void;
  onReject?: (req: CourseChangeRequest) => void;
  onViewDetail?: (req: CourseChangeRequest) => void;
}

export function AdminChangeRequestTable({
  requests,
  isLoading,
  isFiltering = false,
  approvingId,
  rejectingId,
  onApprove,
  onReject,
  onViewDetail,
}: Props) {
  if (isLoading) {
    return (
      <div className="divide-y divide-border/40">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2 px-5 py-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-[40%]" />
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="ml-auto h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-3.5 w-[60%]" />
          </div>
        ))}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
        <FileText className="h-8 w-8 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">
          {isFiltering ? "Không tìm thấy yêu cầu phù hợp" : "Không có yêu cầu thay đổi nào"}
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border/40">
      {requests.map((req) => {
        const isApproving = approvingId === req.id;
        const isRejecting = rejectingId === req.id;
        const isBusy = isApproving || isRejecting;
        const isPending = req.status === "pending";

        const kindCfg = KIND_CONFIG[req.kind] ?? {
          label: req.kind,
          icon: <HelpCircle className="h-3 w-3" />,
          colorClass: "bg-muted text-muted-foreground border-border",
        };
        const statusCfg = STATUS_CONFIG[req.status as keyof typeof STATUS_CONFIG] ?? {
          label: req.status,
          colorClass: "bg-muted text-muted-foreground border-border",
        };

        return (
          <div
            key={req.id}
            className="group flex cursor-pointer flex-col gap-2 px-5 py-4 transition-colors hover:bg-primary/2"
            onClick={() => onViewDetail?.(req)}
          >
            {/* Row 1: course name + badges + actions */}
            <div className="flex min-w-0 items-center gap-2">
              {/* Course name */}
              <p className="min-w-0 truncate text-sm font-medium leading-snug">
                {req.course?.name ?? `Khoá học #${req.courseId}`}
              </p>

              {/* Kind badge */}
              <span
                className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${kindCfg.colorClass}`}
              >
                {kindCfg.icon}
                {kindCfg.label}
              </span>

              {/* Status badge */}
              <span
                className={`ml-auto inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusCfg.colorClass}`}
              >
                {statusCfg.label}
              </span>

              {/* Actions */}
              <div className="flex shrink-0 items-center gap-1" onClick={(e) => e.stopPropagation()}>
                {isPending ? (
                  <>
                    <Button
                      size="sm"
                      className="h-7 gap-1 bg-emerald-600 px-2.5 text-[11px] font-medium text-white hover:bg-emerald-700"
                      onClick={() => onApprove?.(req)}
                      disabled={isBusy}
                    >
                      {isApproving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                      Duyệt
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 gap-1 border-destructive/30 px-2.5 text-[11px] font-medium text-destructive hover:bg-destructive/5 hover:text-destructive"
                      onClick={() => onReject?.(req)}
                      disabled={isBusy}
                    >
                      {isRejecting ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                      Từ chối
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 gap-1 px-2 text-[11px] text-muted-foreground"
                    onClick={() => onViewDetail?.(req)}
                  >
                    <Eye className="h-3 w-3" />
                    Xem
                  </Button>
                )}
              </div>
            </div>

            {/* Row 2: inline diff preview + meta */}
            <div className="flex min-w-0 items-center gap-4">
              <div className="min-w-0 flex-1">
                <InlinePreview req={req} />
              </div>
              <div className="flex shrink-0 items-center gap-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {req.requester
                    ? `${req.requester.firstName} ${req.requester.lastName}`.trim()
                    : `#${req.requestedBy}`}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(req.created_at)}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
