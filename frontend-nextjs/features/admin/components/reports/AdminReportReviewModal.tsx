"use client";

import { useState, type ReactNode } from "react";
import {
  X,
  Loader2,
  User,
  Target,
  FileText,
  ShieldAlert,
  CalendarDays,
  BookOpen,
  GraduationCap,
  PlayCircle,
  ShieldBan,
  Mail,
  Hash,
  Ban,
} from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useReviewReport } from "../../api/admin-reports.hooks";
import type {
  Report,
  ReportStatus,
  ReportTargetType,
  ReportTargetCourse,
  ReportTargetLesson,
  ReportTargetTeacher,
} from "../../types/report.types";

const TARGET_TYPE_CONFIG: Record<ReportTargetType, { label: string; icon: ReactNode; badgeClass: string }> = {
  course: {
    label: "Khóa học",
    icon: <BookOpen className="h-3 w-3" />,
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800",
  },
  lesson: {
    label: "Bài học",
    icon: <PlayCircle className="h-3 w-3" />,
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-800",
  },
  teacher: {
    label: "Giảng viên",
    icon: <GraduationCap className="h-3 w-3" />,
    badgeClass: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800",
  },
};

const STATUS_CONFIG: Record<ReportStatus, { label: string; className: string }> = {
  pending: {
    label: "Chờ xử lý",
    className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400",
  },
  approved: {
    label: "Đã duyệt",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400",
  },
  rejected: {
    label: "Đã từ chối",
    className: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400",
  },
};


function TargetDetail({ report }: { report: Report }) {
  const { targetType, targetId, target } = report;

  if (!target) {
    return (
      <span className="font-mono text-sm text-muted-foreground">ID #{targetId}</span>
    );
  }

  if (targetType === "course") {
    const t = target as ReportTargetCourse;
    return (
      <div className="space-y-1.5 text-sm">
        <p className="font-semibold text-foreground">{t.name}</p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Hash className="h-3 w-3" />ID {t.id}</span>
          <StatusPill value={t.status} />
        </div>
      </div>
    );
  }

  if (targetType === "lesson") {
    const t = target as ReportTargetLesson;
    return (
      <div className="space-y-1.5 text-sm">
        <p className="font-semibold text-foreground">{t.title}</p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Hash className="h-3 w-3" />ID {t.id}</span>
          <span>Khóa #{t.courseId}</span>
          <StatusPill value={t.status} />
        </div>
      </div>
    );
  }

  if (targetType === "teacher") {
    const t = target as ReportTargetTeacher;
    const name = [t.firstName, t.lastName].filter(Boolean).join(" ").trim() || "—";
    return (
      <div className="space-y-1.5 text-sm">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-foreground">{name}</p>
          {t.isBanned && (
            <span className="flex items-center gap-0.5 rounded-full bg-destructive/10 px-1.5 py-0.5 text-[10px] font-semibold text-destructive">
              <ShieldBan className="h-2.5 w-2.5" />
              Đã bị cấm
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Hash className="h-3 w-3" />ID {t.id}</span>
          <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{t.email}</span>
        </div>
      </div>
    );
  }

  return null;
}

function StatusPill({ value }: { value: string }) {
  const config: Record<string, { label: string; cls: string }> = {
    // Course statuses
    publish:  { label: "Đang hiển thị", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    draft:    { label: "Nháp",          cls: "bg-muted text-muted-foreground border-border" },
    pending:  { label: "Chờ duyệt",     cls: "bg-amber-50 text-amber-700 border-amber-200" },
    approved: { label: "Đã duyệt",      cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    rejected: { label: "Đã từ chối",    cls: "bg-red-50 text-red-700 border-red-200" },
    banned:   { label: "Đã bị cấm",     cls: "bg-red-50 text-red-700 border-red-200" },
    // Lesson statuses
    active:   { label: "Hoạt động",     cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    blocked:  { label: "Đã bị khóa",    cls: "bg-red-50 text-red-700 border-red-200" },
    removed:  { label: "Đã xóa",        cls: "bg-muted text-muted-foreground border-border" },
  };
  const { label, cls } = config[value] ?? { label: value, cls: "bg-muted text-muted-foreground border-border" };
  return (
    <span className={`rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${cls}`}>
      {label}
    </span>
  );
}

function formatDateTime(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function userDisplayName(
  user: { firstName?: string | null; lastName?: string | null; email: string } | undefined,
  fallbackId: number,
) {
  if (!user) return `ID #${fallbackId}`;
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return name || user.email;
}

interface Props {
  report: Report | null;
  open: boolean;
  onClose: () => void;
}

export function AdminReportReviewModal({ report, open, onClose }: Props) {
  const [reviewNote, setReviewNote] = useState("");
  const review = useReviewReport();

  const isPending = report?.status === "pending";
  const isBusy = review.isPending;

  const handleReview = async (decision: "approved" | "rejected", banTarget: boolean) => {
    if (!report) return;
    try {
      await review.mutateAsync({
        id: report.id,
        dto: {
          decision,
          reviewNote: reviewNote.trim() || undefined,
          banTarget: banTarget || undefined,
        },
      });
      const label = decision === "approved" ? (banTarget ? "Đã ban đối tượng báo cáo" : "Đã duyệt báo cáo") : "Đã huỷ báo cáo";
      toast.success(label);
      setReviewNote("");
      onClose();
    } catch {
      toast.error("Thao tác thất bại. Vui lòng thử lại.");
    }
  };

  const handleClose = () => {
    setReviewNote("");
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && handleClose()}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-lg">
        {/* Top stripe */}
        <div className="h-1 shrink-0 bg-linear-to-r from-primary/80 via-amber-400/80 to-primary/20" />

        {/* Scrollable content */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="p-6">
            {report && (
              <>
                {/* Header */}
                <SheetHeader className="mb-5 space-y-0 text-left">
                  <div className="flex items-start justify-between gap-3">
                    <SheetTitle className="text-base leading-snug">
                      Báo cáo #{report.id}
                    </SheetTitle>
                    <Badge
                      variant="outline"
                      className={`shrink-0 text-xs font-medium ${STATUS_CONFIG[report.status].className}`}
                    >
                      {STATUS_CONFIG[report.status].label}
                    </Badge>
                  </div>
                  <SheetDescription className="mt-1.5 text-xs text-muted-foreground">
                    Tạo lúc {formatDateTime(report.created_at)}
                  </SheetDescription>
                </SheetHeader>

                {/* Đối tượng bị báo cáo */}
                <div className="mb-4 rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
                  <p className="mb-2.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <Target className="h-3 w-3" />
                    Đối tượng bị báo cáo
                  </p>
                  <div className="space-y-2">
                    <Badge
                      variant="outline"
                      className={`flex w-fit items-center gap-1 text-xs font-medium ${TARGET_TYPE_CONFIG[report.targetType].badgeClass}`}
                    >
                      {TARGET_TYPE_CONFIG[report.targetType].icon}
                      {TARGET_TYPE_CONFIG[report.targetType].label}
                    </Badge>
                    <TargetDetail report={report} />
                  </div>
                </div>

                {/* Người báo cáo */}
                <div className="mb-4 rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
                  <p className="mb-2.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <User className="h-3 w-3" />
                    Người báo cáo
                  </p>
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                      {report.reporter?.firstName?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium leading-tight">
                        {userDisplayName(report.reporter, report.reporterId)}
                      </p>
                      {report.reporter?.email && (
                        <p className="truncate text-xs text-muted-foreground">
                          {report.reporter.email}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Lý do */}
                <div className="mb-4">
                  <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <FileText className="h-3 w-3" />
                    Lý do báo cáo
                  </p>
                  <p className="rounded-xl bg-muted/30 px-4 py-3 text-sm leading-relaxed text-foreground/80">
                    {report.reason}
                  </p>
                </div>

                {/* Kết quả xử lý (nếu đã review) */}
                {report.status !== "pending" && (
                  <>
                    <Separator className="mb-4" />
                    <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
                      <p className="mb-2.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        <ShieldAlert className="h-3 w-3" />
                        Kết quả xử lý
                      </p>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                          <span>Xử lý lúc {formatDateTime(report.reviewedAt)}</span>
                        </div>
                        {report.approver && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <User className="h-3.5 w-3.5 shrink-0" />
                            <span>
                              Bởi {userDisplayName(report.approver, report.approverId ?? 0)}
                            </span>
                          </div>
                        )}
                        {report.reviewNote && (
                          <p className="mt-2 rounded-lg bg-background px-3 py-2 text-xs leading-relaxed text-foreground/70">
                            {report.reviewNote}
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Ghi chú xử lý (chỉ hiện khi pending) */}
                {isPending && (
                  <>
                    <Separator className="mb-4 mt-5" />
                    <div className="space-y-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Ghi chú xử lý (tuỳ chọn)
                      </p>
                      <Textarea
                        placeholder="Nhập ghi chú về quyết định xử lý..."
                        className="h-20 resize-none text-sm"
                        value={reviewNote}
                        onChange={(e) => setReviewNote(e.target.value)}
                        maxLength={2000}
                      />
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        {report && (
          <div className="shrink-0 border-t border-border/60 bg-background p-4">
            {isPending ? (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => handleReview("rejected", false)}
                  disabled={isBusy}
                >
                  {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                  Huỷ báo cáo
                </Button>
                <Button
                  className="flex-1 gap-2 bg-destructive text-white hover:bg-destructive/90"
                  onClick={() => handleReview("approved", true)}
                  disabled={isBusy}
                >
                  {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Ban className="h-3.5 w-3.5" />}
                  Ban
                </Button>
              </div>
            ) : (
              <Button variant="outline" className="w-full" onClick={handleClose}>
                Đóng
              </Button>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
