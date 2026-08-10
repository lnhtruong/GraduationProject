"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";

import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  FileText,
  History,
  PlusCircle,
  RefreshCw,
  Trash2,
  XCircle,
  PenLine,
  BookOpen,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  FIELD_LABELS,
  NON_TEXT_DIFF_FIELDS,
  formatDiffValue,
  getDisplayChangeDiffs,
} from "@/features/admin/components/change-requests/change-request-format";
import type {
  CourseChangeRequest,
  CourseChangeRequestKind,
  CourseChangeRequestStatus,
} from "@/features/admin/types/change-request.types";
import {
  useCancelInstructorChangeRequest,
  useInstructorCourseChangeRequests,
} from "../api/course-management.hooks";

const KIND_CONFIG: Record<
  CourseChangeRequestKind,
  { label: string; className: string; icon: ReactNode }
> = {
  "course.update": {
    label: "Sửa khóa học",
    className: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950/30 dark:text-sky-300",
    icon: <BookOpen className="h-3 w-3" />,
  },
  "lesson.create": {
    label: "Thêm bài học",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300",
    icon: <PlusCircle className="h-3 w-3" />,
  },
  "lesson.update": {
    label: "Sửa bài học",
    className: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-300",
    icon: <PenLine className="h-3 w-3" />,
  },
  "lesson.delete": {
    label: "Xóa bài học",
    className: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-300",
    icon: <Trash2 className="h-3 w-3" />,
  },

};

const STATUS_CONFIG: Record<
  CourseChangeRequestStatus,
  { label: string; className: string; icon: ReactNode }
> = {
  pending: {
    label: "Chờ duyệt",
    className: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300",
    icon: <Clock3 className="h-3 w-3" />,
  },
  approved: {
    label: "Đã duyệt",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  rejected: {
    label: "Từ chối",
    className: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-300",
    icon: <XCircle className="h-3 w-3" />,
  },
};

function formatDateTime(iso?: string) {
  if (!iso) return "--";
  return new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getRequestTitle(request: CourseChangeRequest) {
  if (request.kind === "lesson.delete") {
    return (request.prevData?.title as string) ?? "Bài học đã chọn";
  }

  if (request.kind.startsWith("lesson.")) {
    return (request.payload?.title as string) ?? (request.prevData?.title as string) ?? "Bài học";
  }



  return request.course?.name ?? "Thông tin khóa học";
}

function DiffPreview({ request }: { request: CourseChangeRequest }) {
  const textDiffs = getDisplayChangeDiffs(request.changes).filter(
    (change) => !NON_TEXT_DIFF_FIELDS.has(change.field),
  );

  if (request.kind === "lesson.create") {
    return <span>Thêm mới: {getRequestTitle(request)}</span>;
  }

  if (request.kind === "lesson.delete") {
    return <span>Xóa: {getRequestTitle(request)}</span>;
  }

  if (textDiffs.length === 0) {
    return <span>Không có diff dạng văn bản để hiển thị nhanh.</span>;
  }

  return (
    <span className="flex flex-wrap gap-x-3 gap-y-1">
      {textDiffs.slice(0, 3).map((change) => {
        const fromValue = formatDiffValue(change.field, change.from);
        const toValue = formatDiffValue(change.field, change.to);
        return (
          <span key={change.field} className="inline-flex min-w-0 items-baseline gap-1">
            <span className="font-medium text-muted-foreground">
              {FIELD_LABELS[change.field] ?? change.field}:
            </span>
            {fromValue ? (
              <span className="inline-block max-w-24 truncate text-muted-foreground/60 line-through">
                {fromValue}
              </span>
            ) : null}
            {fromValue && toValue ? <span className="text-muted-foreground/50">→</span> : null}
            {toValue ? (
              <span className="inline-block max-w-32 truncate text-foreground">{toValue}</span>
            ) : null}
          </span>
        );
      })}
      {textDiffs.length > 3 ? (
        <span className="text-muted-foreground/70">+{textDiffs.length - 3} trường khác</span>
      ) : null}
    </span>
  );
}

function RequestRow({
  request,
  onView,
}: {
  request: CourseChangeRequest;
  onView: (request: CourseChangeRequest) => void;
}) {
  const kindConfig = KIND_CONFIG[request.kind];
  const statusConfig = STATUS_CONFIG[request.status];

  return (
    <div className="flex flex-col gap-2 border-t border-border/40 px-4 py-3 first:border-t-0 sm:flex-row sm:items-start sm:justify-between sm:px-5">
      <div className="min-w-0 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={cn("gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold", kindConfig.className)}>
            {kindConfig.icon}
            {kindConfig.label}
          </Badge>
          <Badge variant="outline" className={cn("gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold", statusConfig.className)}>
            {statusConfig.icon}
            {statusConfig.label}
          </Badge>
        </div>
        <p className="truncate text-sm font-semibold text-foreground">{getRequestTitle(request)}</p>
        <p className="text-xs text-muted-foreground">
          <DiffPreview request={request} />
        </p>
        {request.reviewNote ? (
          <p className="text-xs text-muted-foreground">Ghi chú duyệt: {request.reviewNote}</p>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center justify-between gap-2 text-xs text-muted-foreground sm:flex-col sm:items-end sm:text-right">
        <span>{formatDateTime(request.created_at)}</span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 gap-1 rounded-lg px-2 text-[11px]"
          onClick={() => onView(request)}
        >
          <Eye className="h-3 w-3" />
          Chi tiết
        </Button>
      </div>
    </div>
  );
}

function ChangeRequestDetailSheet({
  request,
  open,
  isCancelling,
  onClose,
  onCancel,
}: {
  request: CourseChangeRequest | null;
  open: boolean;
  isCancelling: boolean;
  onClose: () => void;
  onCancel: (request: CourseChangeRequest) => void;
}) {
  const kindConfig = request ? KIND_CONFIG[request.kind] : null;
  const statusConfig = request ? STATUS_CONFIG[request.status] : null;

  return (
    <Sheet open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <SheetContent
        side="right"
        className="inset-x-0 bottom-0 top-auto right-auto flex h-auto max-h-[82dvh] w-full flex-col gap-0 rounded-t-2xl border-l-0 border-t p-0 data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom [--tw-enter-translate-x:0] [--tw-exit-translate-x:0] md:inset-y-0 md:left-auto md:right-0 md:bottom-auto md:h-full md:max-h-none md:w-3/4 md:max-w-xl md:rounded-none md:border-l md:border-t-0 md:data-[state=closed]:slide-out-to-right md:data-[state=open]:slide-in-from-right md:![--tw-enter-translate-x:100%] md:![--tw-exit-translate-x:100%] md:![--tw-enter-translate-y:0] md:![--tw-exit-translate-y:0]"
      >
        <div className="h-1 shrink-0 bg-linear-to-r from-amber-400 via-sky-400 to-emerald-400" />
        <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
          {request ? (
            <>
              <SheetHeader className="mb-4 pr-8 text-left">
                <SheetTitle className="text-base leading-snug">
                  {getRequestTitle(request)}
                </SheetTitle>
                <SheetDescription>
                  Gửi lúc {formatDateTime(request.created_at)}
                </SheetDescription>
              </SheetHeader>

              <div className="mb-4 flex flex-wrap gap-2">
                {kindConfig ? (
                  <Badge variant="outline" className={cn("gap-1 rounded-md px-2 py-0.5 text-xs font-semibold", kindConfig.className)}>
                    {kindConfig.icon}
                    {kindConfig.label}
                  </Badge>
                ) : null}
                {statusConfig ? (
                  <Badge variant="outline" className={cn("gap-1 rounded-md px-2 py-0.5 text-xs font-semibold", statusConfig.className)}>
                    {statusConfig.icon}
                    {statusConfig.label}
                  </Badge>
                ) : null}
              </div>

              <Separator className="my-4" />
              <div className="space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Nội dung thay đổi
                </p>

                {(request.changes ?? []).length > 0 ? (
                  <div className="space-y-2">
                    {getDisplayChangeDiffs(request.changes)
                      .filter((change) => !NON_TEXT_DIFF_FIELDS.has(change.field))
                      .map((change) => (
                        <div key={change.field} className="rounded-xl border border-border/50 bg-background p-3 text-sm">
                          <p className="mb-2 text-xs font-semibold text-muted-foreground">
                            {FIELD_LABELS[change.field] ?? change.field}
                          </p>
                          <div className="grid gap-2 sm:grid-cols-2">
                            <div className="rounded-lg bg-rose-500/5 p-2">
                              <p className="mb-1 text-[10px] font-bold uppercase text-rose-600">Cũ</p>
                              <p className="break-words text-muted-foreground line-through">
                                {formatDiffValue(change.field, change.from) ?? "--"}
                              </p>
                            </div>
                            <div className="rounded-lg bg-emerald-500/5 p-2">
                              <p className="mb-1 text-[10px] font-bold uppercase text-emerald-600">Mới</p>
                              <p className="break-words font-medium text-foreground">
                                {formatDiffValue(change.field, change.to) ?? "--"}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : null}
              </div>

              {request.reviewNote ? (
                <div className="mt-4 rounded-xl border border-border/50 bg-muted/20 p-3 text-sm">
                  <p className="mb-1 text-xs font-semibold text-muted-foreground">Ghi chú duyệt</p>
                  <p>{request.reviewNote}</p>
                </div>
              ) : null}
            </>
          ) : null}
        </div>
        {request?.status === "pending" ? (
          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border/50 p-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isCancelling}>
              Đóng
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isCancelling}
              onClick={() => onCancel(request)}
            >
              {isCancelling ? "Đang hủy..." : "Hủy yêu cầu"}
            </Button>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
interface Props {
  courseId: number;
}

export function InstructorChangeRequestPanel({ courseId }: Props) {
  const [statusFilter, setStatusFilter] = useState<CourseChangeRequestStatus | "all">("pending");
  const [page, setPage] = useState(1);
  const [selectedRequest, setSelectedRequest] = useState<CourseChangeRequest | null>(null);
  const pageSize = 6;

  const params = useMemo(
    () => ({
      status: statusFilter === "all" ? undefined : statusFilter,
      page,
      limit: pageSize,
    }),
    [page, statusFilter],
  );

  const { data, isLoading, isFetching, refetch } = useInstructorCourseChangeRequests(courseId, params);
  const { data: pendingData } = useInstructorCourseChangeRequests(courseId, {
    status: "pending",
    page: 1,
    limit: 1,
  });

  const requests = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pendingCount = pendingData?.total ?? 0;

  const cancelRequest = useCancelInstructorChangeRequest({
    onSuccess: () => {
      toast.success("Đã hủy yêu cầu thay đổi");
      setSelectedRequest(null);
    },
    onError: () => {
      toast.error("Không thể hủy yêu cầu thay đổi");
    },
  });

  return (
    <>
      <Sheet>
        <SheetTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 flex-1 justify-center gap-1.5 rounded-xl px-3.5 shadow-xs sm:flex-initial"
          >
            {pendingCount > 0 ? (
              <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
            ) : (
              <History className="h-3.5 w-3.5" />
            )}
            <span className="hidden sm:inline">Yêu cầu thay đổi</span>
            <span className="sm:hidden">Yêu cầu</span>
            {pendingCount > 0 ? (
              <Badge className="ml-0.5 h-5 rounded-md px-1.5 text-[10px]">
                {pendingCount}
              </Badge>
            ) : null}
          </Button>
        </SheetTrigger>
        <SheetContent
          side="right"
          className="inset-x-0 bottom-0 top-auto right-auto flex h-auto max-h-[82dvh] w-full flex-col gap-0 rounded-t-2xl border-l-0 border-t p-0 data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom [--tw-enter-translate-x:0] [--tw-exit-translate-x:0] md:inset-y-0 md:left-auto md:right-0 md:bottom-auto md:h-full md:max-h-none md:w-3/4 md:max-w-3xl md:rounded-none md:border-l md:border-t-0 md:data-[state=closed]:slide-out-to-right md:data-[state=open]:slide-in-from-right md:![--tw-enter-translate-x:100%] md:![--tw-exit-translate-x:100%] md:![--tw-enter-translate-y:0] md:![--tw-exit-translate-y:0]"
        >
          <div className="h-1 shrink-0 bg-linear-to-r from-amber-400 via-sky-400 to-emerald-400" />
          <div className="shrink-0 border-b border-border/50 px-4 py-4 sm:px-5">
            <SheetHeader className="min-w-0 p-0 pr-10 text-left">
              <div className="flex flex-wrap items-center gap-2">
                <SheetTitle className="text-base font-bold">Yêu cầu thay đổi</SheetTitle>
                {pendingCount > 0 ? (
                  <Badge variant="outline" className="rounded-md border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
                    {pendingCount === 1
                      ? "1 yêu cầu đang chờ duyệt"
                      : `${pendingCount} yêu cầu đang chờ duyệt`}
                  </Badge>
                ) : null}
              </div>
              <SheetDescription className="mt-1 text-xs">
                Các chỉnh sửa trên khóa học đã duyệt/xuất bản sẽ chờ admin xử lý ở đây.
              </SheetDescription>
            </SheetHeader>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3 h-8 w-full gap-1.5 rounded-xl text-xs sm:w-auto sm:px-3"
              disabled={isFetching}
              onClick={() => {
                void refetch();
              }}
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} />
              Làm mới
            </Button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted/40 p-1 sm:inline-grid sm:grid-cols-4">
                {([
                  ["pending", "Chờ duyệt"],
                  ["all", "Tất cả"],
                  ["approved", "Đã duyệt"],
                  ["rejected", "Từ chối"],
                ] as const).map(([value, label]) => (
                  <Button
                    key={value}
                    type="button"
                    variant={statusFilter === value ? "secondary" : "ghost"}
                    size="sm"
                    className="h-8 rounded-lg px-2.5 text-xs"
                    onClick={() => {
                      setStatusFilter(value);
                      setPage(1);
                    }}
                  >
                    {label}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {total > 0
                  ? `Hiển thị ${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, total)} / ${total}`
                  : "Không có bản ghi"}
              </p>
            </div>

            {isLoading ? (
              <div className="space-y-2 border-t border-border/40 p-4 sm:p-5">
                <Skeleton className="h-14 w-full rounded-xl" />
                <Skeleton className="h-14 w-full rounded-xl" />
              </div>
            ) : requests.length > 0 ? (
              <div>
                {requests.map((request) => (
                  <RequestRow
                    key={request.id}
                    request={request}
                    onView={setSelectedRequest}
                  />
                ))}
              </div>
            ) : (
              <div className="flex items-start gap-3 border-t border-border/40 px-4 py-4 text-left sm:px-5">
                <div className="mt-0.5 rounded-lg bg-muted/60 p-2 text-muted-foreground">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-semibold text-foreground">
                    {statusFilter === "pending" ? "Không có yêu cầu đang chờ" : "Không có yêu cầu phù hợp"}
                  </p>
                  <p className="max-w-2xl text-xs leading-5 text-muted-foreground">
                    Khi bạn sửa khóa học hoặc bài học đã publish, hệ thống sẽ gửi request để admin duyệt và hiển thị trạng thái ở đây.
                  </p>
                </div>
              </div>
            )}
          </div>

          {!isLoading && totalPages > 1 ? (
            <div className="flex shrink-0 items-center justify-between border-t border-border/40 px-4 py-3 sm:px-5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 rounded-xl text-xs"
                disabled={page <= 1 || isFetching}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Trước
              </Button>
              <span className="text-xs text-muted-foreground">Trang {page}/{totalPages}</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 rounded-xl text-xs"
                disabled={page >= totalPages || isFetching}
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              >
                Sau
              </Button>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
      <ChangeRequestDetailSheet
        request={selectedRequest}
        open={Boolean(selectedRequest)}
        isCancelling={cancelRequest.isPending}
        onClose={() => setSelectedRequest(null)}
        onCancel={(request) => {
          void cancelRequest.mutateAsync(request.id);
        }}
      />
    </>
  );
}