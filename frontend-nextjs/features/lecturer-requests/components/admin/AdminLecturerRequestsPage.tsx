"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  RefreshCw,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useAdminLecturerRequests,
  useReviewLecturerRequest,
} from "../../api/lecturer-requests.hooks";
import type { LecturerRequest } from "../../types/lecturer-request.types";
import { AdminLecturerRequestReviewSheet } from "./AdminLecturerRequestReviewSheet";
import { AdminLecturerRequestTable } from "./AdminLecturerRequestTable";

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 400;

type ConfirmAction =
  | { type: "approve"; request: LecturerRequest }
  | { type: "reject"; request: LecturerRequest };

export default function AdminLecturerRequestsPage() {
  const [selectedRequest, setSelectedRequest] = useState<LecturerRequest | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [pendingPage, setPendingPage] = useState(1);
  const [allPage, setAllPage] = useState(1);
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setSearch(searchInput);
      setPendingPage(1);
      setAllPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchInput]);

  const serverFilters = { search: search || undefined };

  const pendingRequests = useAdminLecturerRequests({
    status: "pending",
    page: pendingPage,
    limit: PAGE_SIZE,
    ...serverFilters,
  });

  const allRequests = useAdminLecturerRequests({
    page: allPage,
    limit: PAGE_SIZE,
    ...serverFilters,
  });

  const reviewMutation = useReviewLecturerRequest();
  const isFiltering = search.trim() !== "";

  const handleConfirm = async () => {
    if (!confirmAction) return;
    const { request } = confirmAction;
    const isApprove = confirmAction.type === "approve";

    if (isApprove) setApprovingId(request.id);
    else setRejectingId(request.id);

    try {
      await reviewMutation.mutateAsync({
        id: request.id,
        dto: { approve: isApprove },
      });
      const name =
        [request.requester?.lastName, request.requester?.firstName].filter(Boolean).join(" ") ||
        request.requester?.email ||
        `#${request.id}`;
      toast.success(
        isApprove ? `Đã duyệt yêu cầu của ${name}.` : `Đã từ chối yêu cầu của ${name}.`,
      );
    } catch {
      toast.error("Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setApprovingId(null);
      setRejectingId(null);
      setConfirmAction(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 border-b border-border/50 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight">Yêu cầu Giảng viên</h1>
          <p className="mt-0.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Xem xét và phê duyệt yêu cầu nâng role từ Student lên Lecturer.
          </p>
        </div>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <div className="rounded-xl border bg-background p-3 shadow-sm sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <TabsList className="grid h-9 w-full grid-cols-2 rounded-lg bg-muted/50 p-0.5 sm:w-fit">
              <TabsTrigger value="pending" className="h-8 gap-2 rounded-md px-4 text-sm">
                <GraduationCap className="h-3.5 w-3.5" />
                Chờ duyệt
              </TabsTrigger>
              <TabsTrigger value="all" className="h-8 rounded-md px-4 text-sm">
                Tất cả
              </TabsTrigger>
            </TabsList>

            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Tìm theo tên, email..."
                className="h-9 w-full pl-8 text-sm"
              />
            </div>
          </div>
        </div>

        <TabsContent value="pending" className="mt-0">
          <LecturerRequestPanel
            title="Đang chờ duyệt"
            count={pendingRequests.data?.pagination.totalItems ?? 0}
            isLoading={pendingRequests.isLoading}
            isError={pendingRequests.isError}
            onRefresh={() => pendingRequests.refetch()}
            requests={pendingRequests.data?.items ?? []}
            isFiltering={isFiltering}
            approvingId={approvingId}
            rejectingId={rejectingId}
            onApprove={(request) => setConfirmAction({ type: "approve", request })}
            onReject={(request) => setConfirmAction({ type: "reject", request })}
            onViewDetail={setSelectedRequest}
            page={pendingPage}
            totalPages={pendingRequests.data?.pagination.totalPages ?? 1}
            pageSize={PAGE_SIZE}
            onPageChange={setPendingPage}
          />
        </TabsContent>

        <TabsContent value="all" className="mt-0">
          <LecturerRequestPanel
            title="Tất cả yêu cầu"
            count={allRequests.data?.pagination.totalItems ?? 0}
            isLoading={allRequests.isLoading}
            isError={allRequests.isError}
            onRefresh={() => allRequests.refetch()}
            requests={allRequests.data?.items ?? []}
            isFiltering={isFiltering}
            approvingId={approvingId}
            rejectingId={rejectingId}
            onApprove={(request) => setConfirmAction({ type: "approve", request })}
            onReject={(request) => setConfirmAction({ type: "reject", request })}
            onViewDetail={setSelectedRequest}
            page={allPage}
            totalPages={allRequests.data?.pagination.totalPages ?? 1}
            pageSize={PAGE_SIZE}
            onPageChange={setAllPage}
          />
        </TabsContent>
      </Tabs>

      <AdminLecturerRequestReviewSheet
        request={selectedRequest}
        open={selectedRequest !== null}
        onClose={() => setSelectedRequest(null)}
      />

      <Dialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <DialogContent className="w-[calc(100vw-1rem)] max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              {confirmAction?.type === "approve" ? "Duyệt yêu cầu Giảng viên" : "Từ chối yêu cầu Giảng viên"}
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed">
              {confirmAction?.type === "approve" ? (
                <>
                  Người dùng <strong>{getRequesterName(confirmAction.request)}</strong> sẽ được nâng lên role <strong>Giảng viên</strong> ngay lập tức.
                </>
              ) : (
                <>
                  Yêu cầu của <strong>{confirmAction ? getRequesterName(confirmAction.request) : "người dùng"}</strong> sẽ bị từ chối. Họ có thể gửi lại yêu cầu mới.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-3">
            <Button
              variant="outline"
              onClick={() => setConfirmAction(null)}
              disabled={reviewMutation.isPending}
              className="w-full sm:w-auto"
            >
              Huỷ
            </Button>
            <Button
              variant={confirmAction?.type === "reject" ? "destructive" : "default"}
              onClick={handleConfirm}
              disabled={reviewMutation.isPending}
              className="w-full sm:w-auto"
            >
              {reviewMutation.isPending ? "Đang xử lý..." : "Xác nhận"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function getRequesterName(request: LecturerRequest) {
  return (
    [request.requester?.lastName, request.requester?.firstName].filter(Boolean).join(" ") ||
    request.requester?.email ||
    `#${request.id}`
  );
}

function LecturerRequestPanel({
  title,
  count,
  isLoading,
  isError,
  onRefresh,
  requests,
  isFiltering,
  approvingId,
  rejectingId,
  onApprove,
  onReject,
  onViewDetail,
  page,
  totalPages,
  pageSize,
  onPageChange,
}: {
  title: string;
  count: number;
  isLoading: boolean;
  isError: boolean;
  onRefresh: () => void;
  requests: LecturerRequest[];
  isFiltering: boolean;
  approvingId: number | null;
  rejectingId: number | null;
  onApprove: (request: LecturerRequest) => void;
  onReject: (request: LecturerRequest) => void;
  onViewDetail: (request: LecturerRequest) => void;
  page: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-background shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 px-4 py-3 sm:px-5">
        <span className="text-sm font-semibold">{title}</span>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">{count} yêu cầu</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={onRefresh}
            disabled={isLoading}
            title="Làm mới"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>
      {isError ? (
        <ErrorRetry onRetry={onRefresh} />
      ) : (
        <>
          <AdminLecturerRequestTable
            requests={requests}
            isLoading={isLoading}
            isFiltering={isFiltering}
            showActions
            approvingId={approvingId}
            rejectingId={rejectingId}
            onApprove={onApprove}
            onReject={onReject}
            onViewDetail={onViewDetail}
          />
          <PaginationRow
            page={page}
            totalPages={totalPages}
            totalItems={count}
            pageSize={pageSize}
            onPageChange={onPageChange}
          />
        </>
      )}
    </div>
  );
}

function ErrorRetry({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
      <AlertTriangle className="h-8 w-8 text-destructive/60" />
      <p className="text-sm text-muted-foreground">Không thể tải dữ liệu</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RefreshCw className="mr-2 h-3.5 w-3.5" />
        Thử lại
      </Button>
    </div>
  );
}

function PaginationRow({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);

  return (
    <div className="flex flex-col gap-2 border-t border-border/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <span className="text-xs text-muted-foreground">
        {from}-{to} / {totalItems}
      </span>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="min-w-15 text-center text-xs text-muted-foreground">
          {page} / {totalPages}
        </span>
        <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
