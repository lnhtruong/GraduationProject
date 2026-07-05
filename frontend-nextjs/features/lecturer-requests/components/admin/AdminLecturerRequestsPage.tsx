"use client";

import { useState, useEffect, useRef } from "react";
import {
  GraduationCap,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AdminLecturerRequestTable } from "./AdminLecturerRequestTable";
import { AdminLecturerRequestReviewSheet } from "./AdminLecturerRequestReviewSheet";
import {
  useAdminLecturerRequests,
  useReviewLecturerRequest,
} from "../../api/lecturer-requests.hooks";
import type { LecturerRequest } from "../../types/lecturer-request.types";

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

  const {
    data: pendingData,
    isLoading: isPendingLoading,
    isError: isPendingError,
    refetch: refetchPending,
  } = useAdminLecturerRequests({
    status: "pending",
    page: pendingPage,
    limit: PAGE_SIZE,
    ...serverFilters,
  });

  const {
    data: allData,
    isLoading: isAllLoading,
    isError: isAllError,
    refetch: refetchAll,
  } = useAdminLecturerRequests({
    page: allPage,
    limit: PAGE_SIZE,
    ...serverFilters,
  });

  const pendingTotalPages = pendingData?.pagination.totalPages ?? 1;
  const allTotalPages = allData?.pagination.totalPages ?? 1;
  const isFiltering = search.trim() !== "";

  const reviewMutation = useReviewLecturerRequest();

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
        [request.requester?.firstName, request.requester?.lastName].filter(Boolean).join(" ") ||
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
      {/* Page header */}
      <div className="flex items-end justify-between gap-4 border-b border-border/50 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Yêu cầu Giảng viên</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Xem xét và phê duyệt yêu cầu nâng role từ Student lên Lecturer
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending" className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TabsList className="h-9 rounded-lg bg-muted/50 p-0.5">
            <TabsTrigger value="pending" className="h-8 gap-2 rounded-md px-4 text-sm">
              <GraduationCap className="h-3.5 w-3.5" />
              Chờ duyệt
            </TabsTrigger>
            <TabsTrigger value="all" className="h-8 rounded-md px-4 text-sm">
              Tất cả
            </TabsTrigger>
          </TabsList>

          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm theo tên, email..."
              className="h-9 w-64 pl-8 text-sm"
            />
          </div>
        </div>

        {/* Tab: pending */}
        <TabsContent value="pending" className="mt-0">
          <div className="overflow-hidden rounded-xl border border-border/60 bg-background shadow-sm">
            <div className="border-b border-border/50 px-5 py-3">
              <span className="text-sm font-semibold">Đang chờ duyệt</span>
            </div>
            {isPendingError ? (
              <ErrorRetry onRetry={() => refetchPending()} />
            ) : (
              <>
                <AdminLecturerRequestTable
                  requests={pendingData?.items ?? []}
                  isLoading={isPendingLoading}
                  isFiltering={isFiltering}
                  showActions
                  approvingId={approvingId}
                  rejectingId={rejectingId}
                  onApprove={(req) => setConfirmAction({ type: "approve", request: req })}
                  onReject={(req) => setConfirmAction({ type: "reject", request: req })}
                  onViewDetail={setSelectedRequest}
                />
                <PaginationRow
                  page={pendingPage}
                  totalPages={pendingTotalPages}
                  totalItems={pendingData?.pagination.totalItems ?? 0}
                  pageSize={PAGE_SIZE}
                  onPageChange={setPendingPage}
                />
              </>
            )}
          </div>
        </TabsContent>

        {/* Tab: all */}
        <TabsContent value="all" className="mt-0">
          <div className="overflow-hidden rounded-xl border border-border/60 bg-background shadow-sm">
            <div className="flex items-center justify-between border-b border-border/50 px-5 py-3">
              <span className="text-sm font-semibold">Tất cả yêu cầu</span>
              <span className="text-xs text-muted-foreground">
                {allData?.pagination.totalItems ?? 0} yêu cầu
              </span>
            </div>
            {isAllError ? (
              <ErrorRetry onRetry={() => refetchAll()} />
            ) : (
              <>
                <AdminLecturerRequestTable
                  requests={allData?.items ?? []}
                  isLoading={isAllLoading}
                  isFiltering={isFiltering}
                  showActions
                  approvingId={approvingId}
                  rejectingId={rejectingId}
                  onApprove={(req) => setConfirmAction({ type: "approve", request: req })}
                  onReject={(req) => setConfirmAction({ type: "reject", request: req })}
                  onViewDetail={setSelectedRequest}
                />
                <PaginationRow
                  page={allPage}
                  totalPages={allTotalPages}
                  totalItems={allData?.pagination.totalItems ?? 0}
                  pageSize={PAGE_SIZE}
                  onPageChange={setAllPage}
                />
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Review sheet */}
      <AdminLecturerRequestReviewSheet
        request={selectedRequest}
        open={selectedRequest !== null}
        onClose={() => setSelectedRequest(null)}
      />

      {/* Confirm dialog */}
      <Dialog
        open={!!confirmAction}
        onOpenChange={(open) => !open && setConfirmAction(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              {confirmAction?.type === "approve"
                ? "Duyệt yêu cầu Giảng viên"
                : "Từ chối yêu cầu Giảng viên"}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {confirmAction?.type === "approve" ? (
                <>
                  Người dùng{" "}
                  <strong>
                    {[
                      confirmAction.request.requester?.firstName,
                      confirmAction.request.requester?.lastName,
                    ]
                      .filter(Boolean)
                      .join(" ") || confirmAction.request.requester?.email}
                  </strong>{" "}
                  sẽ được nâng lên role <strong>Giảng viên</strong> ngay lập tức.
                </>
              ) : (
                <>
                  Yêu cầu của{" "}
                  <strong>
                    {[
                      confirmAction?.request.requester?.firstName,
                      confirmAction?.request.requester?.lastName,
                    ]
                      .filter(Boolean)
                      .join(" ") || confirmAction?.request.requester?.email}
                  </strong>{" "}
                  sẽ bị từ chối. Họ có thể gửi lại yêu cầu mới.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setConfirmAction(null)}
              disabled={reviewMutation.isPending}
            >
              Huỷ
            </Button>
            <Button
              variant={confirmAction?.type === "reject" ? "destructive" : "default"}
              onClick={handleConfirm}
              disabled={reviewMutation.isPending}
            >
              {reviewMutation.isPending ? "Đang xử lý..." : "Xác nhận"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
  onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);
  return (
    <div className="flex items-center justify-between border-t border-border/50 px-5 py-3">
      <span className="text-xs text-muted-foreground">
        {from}–{to} / {totalItems}
      </span>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="min-w-15 text-center text-xs text-muted-foreground">
          {page} / {totalPages}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
