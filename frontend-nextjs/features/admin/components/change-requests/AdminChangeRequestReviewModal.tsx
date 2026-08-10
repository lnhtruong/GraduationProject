"use client";

import { useState } from "react";
import {
  BookOpen,
  PlusCircle,
  PenLine,
  Trash2,

  Check,
  X,
  Loader2,
  User,
  AlertCircle,
  ChevronDown,
  ChevronUp,
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
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "@/components/UserAvatar";
import { useReviewChangeRequest } from "../../api/admin-change-requests.hooks";
import { FIELD_LABELS, NON_TEXT_DIFF_FIELDS, HTML_DIFF_FIELDS, formatDiffValue, getDisplayChangeDiffs } from "./change-request-format";
import { VideoDiffPreview } from "./VideoDiffPreview";
import { sanitizeHtml } from "@/lib/sanitize-html";
import type {
  CourseChangeRequest,
  CourseChangeRequestKind,
  ChangeRequestFieldDiff,
} from "../../types/change-request.types";

// ── Kind config ───────────────────────────────────────────────────────────────

const KIND_CONFIG: Record<
  CourseChangeRequestKind,
  { label: string; icon: React.ReactNode; colorClass: string }
> = {
  "course.update": { label: "Cập nhật khoá học", icon: <BookOpen className="h-3.5 w-3.5" />, colorClass: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800" },
  "lesson.create": { label: "Thêm bài học", icon: <PlusCircle className="h-3.5 w-3.5" />, colorClass: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800" },
  "lesson.update": { label: "Sửa bài học", icon: <PenLine className="h-3.5 w-3.5" />, colorClass: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-400 dark:border-violet-800" },
  "lesson.delete": { label: "Xoá bài học", icon: <Trash2 className="h-3.5 w-3.5" />, colorClass: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800" },
};

const STATUS_LABEL: Record<string, { label: string; colorClass: string }> = {
  pending: { label: "Chờ duyệt", colorClass: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800" },
  approved: { label: "Đã duyệt", colorClass: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800" },
  rejected: { label: "Từ chối", colorClass: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800" },
};

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "long", year: "numeric" });
}

// ── Diff viewer ───────────────────────────────────────────────────────────────

function DiffRow({ field, before, after }: { field: string; before?: unknown; after?: unknown }) {
  const label = FIELD_LABELS[field] ?? field;
  const isHtml = HTML_DIFF_FIELDS.has(field);

  // Field HTML (vd. mô tả khoá học) — render đúng định dạng thay vì strip
  // thành text, vì modal có đủ không gian để hiển thị nội dung có định dạng.
  if (isHtml) {
    const beforeHtml = typeof before === "string" && before.trim() ? sanitizeHtml(before) : null;
    const afterHtml = typeof after === "string" && after.trim() ? sanitizeHtml(after) : null;

    return (
      <div className="rounded-lg border border-border/60 bg-background px-3 py-2.5 text-sm">
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <div className="flex flex-col gap-2">
          {beforeHtml !== null && (
            <div>
              <span className="mb-1 inline-block rounded bg-rose-100 px-1 text-[10px] font-bold text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
                Cũ
              </span>
              <div
                className="rounded-md bg-muted/30 px-2.5 py-2 text-muted-foreground opacity-70 **:line-through [&_ol]:list-decimal [&_ol]:pl-5 [&_p+p]:mt-2 [&_ul]:list-disc [&_ul]:pl-5"
                dangerouslySetInnerHTML={{ __html: beforeHtml }}
              />
            </div>
          )}
          {afterHtml !== null && (
            <div>
              <span className="mb-1 inline-block rounded bg-emerald-100 px-1 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                Mới
              </span>
              <div
                className="rounded-md bg-muted/30 px-2.5 py-2 text-foreground [&_ol]:list-decimal [&_ol]:pl-5 [&_p+p]:mt-2 [&_ul]:list-disc [&_ul]:pl-5"
                dangerouslySetInnerHTML={{ __html: afterHtml }}
              />
            </div>
          )}
          {beforeHtml === null && afterHtml !== null && (
            <span className="text-xs text-muted-foreground italic">(trường mới thêm)</span>
          )}
        </div>
      </div>
    );
  }

  const beforeStr = formatDiffValue(field, before);
  const afterStr = formatDiffValue(field, after);

  return (
    <div className="rounded-lg border border-border/60 bg-background px-3 py-2.5 text-sm">
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="flex flex-col gap-1">
        {beforeStr !== null && (
          <div className="flex items-start gap-2">
            <span className="mt-0.5 shrink-0 rounded bg-rose-100 px-1 text-[10px] font-bold text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
              Cũ
            </span>
            <span className="line-through text-muted-foreground opacity-70">{beforeStr}</span>
          </div>
        )}
        {afterStr !== null && (
          <div className="flex items-start gap-2">
            <span className="mt-0.5 shrink-0 rounded bg-emerald-100 px-1 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
              Mới
            </span>
            <span className="font-medium text-foreground">{afterStr}</span>
          </div>
        )}
        {beforeStr === null && afterStr !== null && (
          <span className="text-xs text-muted-foreground italic">(trường mới thêm)</span>
        )}
      </div>
    </div>
  );
}

function DiffSection({ request }: { request: CourseChangeRequest }) {
  const { kind, changes, prevData } = request;

  if (kind === "lesson.delete") {
    const title = (prevData?.title as string) ?? null;
    const contentTypeLabel = prevData?.contentType != null
      ? formatDiffValue("contentType", prevData.contentType)
      : null;
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50/50 px-3 py-3 dark:border-rose-800/40 dark:bg-rose-950/20">
        <p className="mb-1 text-xs font-semibold text-rose-700 dark:text-rose-400">Bài học sẽ bị xoá</p>
        <p className="text-sm font-medium">{title ?? "—"}</p>
        {contentTypeLabel && (
          <p className="mt-0.5 text-xs text-muted-foreground">Loại: {contentTypeLabel}</p>
        )}
      </div>
    );
  }

  if (kind === "lesson.create") {
    const textDiffs = getDisplayChangeDiffs(changes).filter(
      (c) => !NON_TEXT_DIFF_FIELDS.has(c.field) && !HTML_DIFF_FIELDS.has(c.field),
    );
    const htmlDiffs = getDisplayChangeDiffs(changes).filter((c) => HTML_DIFF_FIELDS.has(c.field));
    const lessonTitle = (changes ?? []).find((c) => c.field === "title")?.to as string | undefined;
    const contentType = (changes ?? []).find((c) => c.field === "contentType")?.to as string | undefined;
    const videoId = (changes ?? []).find((c) => c.field === "videoId")?.to as number | null | undefined;

    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 px-3 py-3 dark:border-emerald-800/40 dark:bg-emerald-950/20">
        <p className="mb-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">Bài học mới sẽ được thêm</p>
        <div className="space-y-1">
          {textDiffs.map((c) => (
            <p key={c.field} className="text-sm">
              <span className="font-medium">{FIELD_LABELS[c.field] ?? c.field}:</span>{" "}
              {formatDiffValue(c.field, c.to) ?? "—"}
            </p>
          ))}
        </div>
        {htmlDiffs.map((c) => {
          const html = typeof c.to === "string" && c.to.trim() ? sanitizeHtml(c.to) : null;
          if (!html) return null;
          return (
            <div key={c.field} className="mt-1.5">
              <span className="text-sm font-medium">{FIELD_LABELS[c.field] ?? c.field}:</span>
              <div
                className="mt-1 rounded-md bg-background px-2.5 py-2 text-sm [&_ol]:list-decimal [&_ol]:pl-5 [&_p+p]:mt-2 [&_ul]:list-disc [&_ul]:pl-5"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            </div>
          );
        })}
        {contentType === "video" && typeof videoId === "number" && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-sm font-medium">Video:</span>
            <VideoDiffPreview videoId={videoId} title={lessonTitle ?? "Bài học mới"} />
          </div>
        )}
      </div>
    );
  }

  const allDiffs: ChangeRequestFieldDiff[] = getDisplayChangeDiffs(changes);
  const diffs = allDiffs.filter((c) => !NON_TEXT_DIFF_FIELDS.has(c.field));
  const videoIdChange = allDiffs.find((c) => c.field === "videoId");
  const newVideoId = typeof videoIdChange?.to === "number" ? videoIdChange.to : null;

  if (diffs.length === 0 && newVideoId === null) {
    return <p className="text-sm text-muted-foreground italic">Không có thay đổi dữ liệu.</p>;
  }

  return (
    <div className="space-y-2">
      {diffs.map((c) => (
        <DiffRow key={c.field} field={c.field} before={c.from} after={c.to} />
      ))}
      {newVideoId !== null && (
        <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-background px-3 py-2.5">
          <span className="text-sm font-medium">Video mới:</span>
          <VideoDiffPreview videoId={newVideoId} title={request.course?.name ?? "Bài học"} />
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

interface Props {
  request: CourseChangeRequest | null;
  open: boolean;
  onClose: () => void;
}

export function AdminChangeRequestReviewModal({ request, open, onClose }: Props) {
  const [note, setNote] = useState("");
  const [showNote, setShowNote] = useState(false);
  const review = useReviewChangeRequest();

  const isBusy = review.isPending;
  const isPending = request?.status === "pending";

  const kindCfg = request
    ? KIND_CONFIG[request.kind]
    : null;

  const statusCfg = request ? (STATUS_LABEL[request.status] ?? { label: request.status, colorClass: "bg-muted text-muted-foreground border-border" }) : null;

  const instructorName = request?.requester
    ? `${request.requester.lastName} ${request.requester.firstName}`.trim()
    : "Giảng viên";
  const instructorEmail = request?.requester?.email ?? null;
  const reviewerName = request?.reviewer
    ? `${request.reviewer.lastName} ${request.reviewer.firstName}`.trim()
    : request?.reviewedBy ? "Quản trị viên" : null;

  const handleDecision = async (decision: "approved" | "rejected") => {
    if (!request) return;
    try {
      await review.mutateAsync({ requestId: request.id, dto: { decision, note: note.trim() || undefined } });
      toast.success(decision === "approved" ? "Đã duyệt yêu cầu thay đổi." : "Đã từ chối yêu cầu thay đổi.");
      setNote("");
      setShowNote(false);
      onClose();
    } catch {
      toast.error("Thao tác thất bại. Vui lòng thử lại.");
    }
  };

  const handleClose = () => {
    if (isBusy) return;
    setNote("");
    setShowNote(false);
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && handleClose()}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-lg">
        {/* Top stripe */}
        <div className="h-1 shrink-0 bg-linear-to-r from-violet-500/80 via-blue-400/80 to-violet-500/20" />

        {/* Scrollable body */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="p-6">
            {request ? (
              <>
                {/* Header */}
                <SheetHeader className="mb-5 space-y-0 pr-8 text-left">
                  <div className="flex items-start justify-between gap-3">
                    <SheetTitle className="line-clamp-2 text-base leading-snug">
                      {request.course?.name ?? "Khóa học liên quan"}
                    </SheetTitle>
                    {statusCfg && (
                      <span className={`inline-flex shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${statusCfg.colorClass}`}>
                        {statusCfg.label}
                      </span>
                    )}
                  </div>
                  <SheetDescription className="mt-1.5 text-xs text-muted-foreground">
                    Gửi lúc {formatDate(request.created_at)}
                  </SheetDescription>
                </SheetHeader>

                {/* Kind badge */}
                {kindCfg && (
                  <div className="mb-4">
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${kindCfg.colorClass}`}>
                      {kindCfg.icon}
                      {kindCfg.label}
                    </span>
                  </div>
                )}

                {/* Instructor */}
                <div className="mb-4 rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
                  <p className="mb-2.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <User className="h-3 w-3" />
                    Giảng viên
                  </p>
                  <div className="flex items-center gap-2.5">
                    <UserAvatar user={request.requester} className="h-8 w-8 shrink-0" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{instructorName}</p>
                      {instructorEmail && (
                        <p className="truncate text-xs text-muted-foreground">{instructorEmail}</p>
                      )}
                    </div>
                  </div>
                </div>

                <Separator className="mb-5" />

                {/* Diff */}
                <div>
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Nội dung thay đổi
                  </p>
                  <DiffSection request={request} />
                </div>

                {/* Review result (non-pending) */}
                {!isPending && (
                  <>
                    <Separator className="my-5" />
                    <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Kết quả xét duyệt
                      </p>
                      {reviewerName && (
                        <p className="text-xs text-muted-foreground">
                          Bởi: <span className="font-medium text-foreground">{reviewerName}</span>
                        </p>
                      )}
                      {request.reviewNote ? (
                        <p className="mt-1.5 text-sm">{request.reviewNote}</p>
                      ) : (
                        <p className="mt-1.5 text-xs italic text-muted-foreground">Không có ghi chú.</p>
                      )}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                Không có dữ liệu
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="shrink-0 border-t border-border/60 bg-background p-4">
          {request && isPending ? (
            <div className="space-y-3">
              {/* Note toggle */}
              <button
                type="button"
                onClick={() => setShowNote((v) => !v)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {showNote ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                {showNote ? "Ẩn ghi chú" : "Thêm ghi chú cho giảng viên (tuỳ chọn)"}
              </button>

              {showNote && (
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Lý do duyệt hoặc từ chối..."
                  className="h-20 resize-none text-sm"
                  maxLength={1000}
                />
              )}

              {/* Warning for delete */}
              {request.kind === "lesson.delete" && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-700 dark:border-amber-700/40 dark:bg-amber-950/30 dark:text-amber-400">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>Duyệt yêu cầu này sẽ <strong>xoá vĩnh viễn</strong> bài học. Học viên đang học sẽ mất quyền truy cập.</span>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 gap-2 border-destructive/30 text-destructive hover:bg-destructive/5 hover:text-destructive"
                  onClick={() => handleDecision("rejected")}
                  disabled={isBusy}
                >
                  {review.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                  Từ chối
                </Button>
                <Button
                  className="flex-1 gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
                  onClick={() => handleDecision("approved")}
                  disabled={isBusy}
                >
                  {review.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  Chấp nhận
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" className="w-full" onClick={handleClose} disabled={isBusy}>
              Đóng
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
