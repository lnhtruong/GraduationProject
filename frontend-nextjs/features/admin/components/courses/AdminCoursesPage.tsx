"use client";

import { useState, useEffect, useRef, type ReactNode } from "react";
import { BookCheck, Clock4, XCircle, Search, ChevronLeft, ChevronRight, SlidersHorizontal, AlertTriangle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AdminCourseTable } from "./AdminCourseTable";
import { AdminCourseReviewModal } from "./AdminCourseReviewModal";
import {
  useAdminCoursesPaginated,
  useAdminCourseStats,
  useApproveCourse,
  useRejectCourse,
} from "../../api/admin-courses.hooks";
import type { Course } from "@/features/courses/types";

type LevelFilter = "all" | "Beginner" | "Intermediate" | "Advanced";
type PriceFilter = "all" | "free" | "under200" | "200to500" | "over500";

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 400;

const PRICE_RANGES: Record<PriceFilter, { label: string; minPrice?: number; maxPrice?: number }> = {
  all:        { label: "Tất cả giá" },
  free:       { label: "Miễn phí",    minPrice: 0,       maxPrice: 0 },
  under200:   { label: "Dưới 200k",   minPrice: 1,       maxPrice: 199_999 },
  "200to500": { label: "200k – 500k", minPrice: 200_000, maxPrice: 500_000 },
  over500:    { label: "Trên 500k",   minPrice: 500_001 },
};

type ConfirmAction = { type: "approve"; course: Course } | { type: "reject"; course: Course };

export default function AdminCoursesPage() {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<LevelFilter>("all");
  const [priceFilter, setPriceFilter] = useState<PriceFilter>("all");
  const [pendingPage, setPendingPage] = useState(1);
  const [allPage, setAllPage] = useState(1);
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setSearch(searchInput); resetPages(); }, SEARCH_DEBOUNCE_MS);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const priceRange = PRICE_RANGES[priceFilter];
  const serverFilters = {
    search: search || undefined,
    level: levelFilter !== "all" ? levelFilter : undefined,
    minPrice: priceRange.minPrice,
    maxPrice: priceRange.maxPrice,
  };

  const { data: pendingData, isLoading: isPendingLoading, isError: isPendingError, refetch: refetchPending } = useAdminCoursesPaginated({
    status: "pending",
    page: pendingPage,
    limit: PAGE_SIZE,
    ...serverFilters,
  });
  const { data: allData, isLoading: isAllLoading, isError: isAllError, refetch: refetchAll } = useAdminCoursesPaginated({
    page: allPage,
    limit: PAGE_SIZE,
    ...serverFilters,
  });

  const { data: pendingStats } = useAdminCourseStats("pending");
  const { data: approvedStats } = useAdminCourseStats("approved");
  const { data: rejectedStats } = useAdminCourseStats("rejected");

  const stats = {
    pending:  pendingStats?.pagination.totalItems  ?? 0,
    approved: approvedStats?.pagination.totalItems ?? 0,
    rejected: rejectedStats?.pagination.totalItems ?? 0,
  };

  const pendingTotalPages = pendingData?.pagination.totalPages ?? 1;
  const allTotalPages     = allData?.pagination.totalPages     ?? 1;

  function resetPages() {
    setPendingPage(1);
    setAllPage(1);
  }

  const isFiltering = search.trim() !== "" || levelFilter !== "all" || priceFilter !== "all";

  const approve = useApproveCourse();
  const reject  = useRejectCourse();

  const handleConfirm = async () => {
    if (!confirmAction) return;
    const { course } = confirmAction;
    if (confirmAction.type === "approve") {
      setApprovingId(course.id);
      try {
        await approve.mutateAsync(course.id);
        toast.success(`Đã duyệt: "${course.name}"`);
      } catch {
        toast.error("Duyệt thất bại. Vui lòng thử lại.");
      } finally {
        setApprovingId(null);
      }
    } else {
      setRejectingId(course.id);
      try {
        await reject.mutateAsync(course.id);
        toast.success(`Đã từ chối: "${course.name}"`);
      } catch {
        toast.error("Từ chối thất bại. Vui lòng thử lại.");
      } finally {
        setRejectingId(null);
      }
    }
    setConfirmAction(null);
  };

  const handleInlineApprove = (course: Course) => setConfirmAction({ type: "approve", course });
  const handleInlineReject  = (course: Course) => setConfirmAction({ type: "reject",  course });

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-end justify-between gap-4 border-b border-border/50 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Duyệt khóa học</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Xem xét và phê duyệt khóa học do giảng viên gửi lên
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <StatChip
            icon={<Clock4 className="h-3.5 w-3.5" />}
            value={stats.pending}
            colorClass="text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-400"
            label="chờ"
          />
          <StatChip
            icon={<BookCheck className="h-3.5 w-3.5" />}
            value={stats.approved}
            colorClass="text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-400"
            label="duyệt"
          />
          <StatChip
            icon={<XCircle className="h-3.5 w-3.5" />}
            value={stats.rejected}
            colorClass="text-destructive bg-destructive/5 border-destructive/20"
            label="từ chối"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending" className="space-y-4">

        {/* ── Toolbar ── */}
        <div className="flex flex-col gap-3">
          {/* Row 1: tabs + search */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <TabsList className="h-9 rounded-lg bg-muted/50 p-0.5">
              <TabsTrigger value="pending" className="h-8 gap-2 rounded-md px-4 text-sm">
                Chờ duyệt
                {stats.pending > 0 && (
                  <span className="min-w-[18px] rounded-full bg-amber-500 px-1 py-0.5 text-[10px] font-bold leading-none text-white">
                    {stats.pending}
                  </span>
                )}
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
                placeholder="Tìm theo tên khoá học..."
                className="h-9 w-64 pl-8 text-sm"
              />
            </div>
          </div>

          {/* Row 2: filters */}
          <div className="flex flex-wrap items-center gap-2">
            <SlidersHorizontal className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />

            {/* Level filter */}
            <Select value={levelFilter} onValueChange={(v) => { setLevelFilter(v as LevelFilter); resetPages(); }}>
              <SelectTrigger size="sm" className="h-8 w-[130px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả level</SelectItem>
                <SelectItem value="Beginner">Sơ cấp</SelectItem>
                <SelectItem value="Intermediate">Trung cấp</SelectItem>
                <SelectItem value="Advanced">Cao cấp</SelectItem>
              </SelectContent>
            </Select>

            {/* Price filter */}
            <Select value={priceFilter} onValueChange={(v) => { setPriceFilter(v as PriceFilter); resetPages(); }}>
              <SelectTrigger size="sm" className="h-8 w-[140px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(PRICE_RANGES) as [PriceFilter, { label: string }][]).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Clear filters */}
            {(searchInput || levelFilter !== "all" || priceFilter !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setSearchInput("");
                  setSearch("");
                  setLevelFilter("all");
                  setPriceFilter("all");
                  resetPages();
                }}
              >
                Xóa filter
              </Button>
            )}
          </div>
        </div>

        {/* Tab: pending */}
        <TabsContent value="pending" className="mt-0">
          <div className="overflow-hidden rounded-xl border border-border/60 bg-background shadow-sm">
            <div className="flex items-center justify-between border-b border-border/50 px-5 py-3">
              <span className="text-sm font-semibold">Khóa học chờ duyệt</span>
              <span className="text-xs text-muted-foreground">{stats.pending} khóa học</span>
            </div>
            {isPendingError ? (
              <ErrorRetry onRetry={() => refetchPending()} />
            ) : (
              <>
                <AdminCourseTable
                  courses={pendingData?.data ?? []}
                  isLoading={isPendingLoading}
                  isFiltering={isFiltering}
                  showActions
                  approvingId={approvingId}
                  rejectingId={rejectingId}
                  onApprove={handleInlineApprove}
                  onReject={handleInlineReject}
                  onViewDetail={setSelectedCourse}
                />
                <Pagination
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
              <span className="text-sm font-semibold">Tất cả khóa học</span>
              <span className="text-xs text-muted-foreground">
                {allData?.pagination.totalItems ?? 0} khóa học
              </span>
            </div>
            {isAllError ? (
              <ErrorRetry onRetry={() => refetchAll()} />
            ) : (
              <>
                <AdminCourseTable
                  courses={allData?.data ?? []}
                  isLoading={isAllLoading}
                  isFiltering={isFiltering}
                  showActions
                  approvingId={approvingId}
                  rejectingId={rejectingId}
                  onApprove={handleInlineApprove}
                  onReject={handleInlineReject}
                  onViewDetail={setSelectedCourse}
                />
                <Pagination
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

      <AdminCourseReviewModal
        course={selectedCourse}
        open={selectedCourse !== null}
        onClose={() => setSelectedCourse(null)}
      />

      <Dialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              {confirmAction?.type === "approve" ? "Duyệt khóa học" : "Từ chối khóa học"}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {confirmAction?.type === "approve" ? (
                <>Bạn có chắc muốn <strong>duyệt</strong> khóa học <strong>"{confirmAction.course.name}"</strong>?</>
              ) : (
                <>Bạn có chắc muốn <strong>từ chối</strong> khóa học <strong>"{confirmAction?.course.name}"</strong>? Giảng viên sẽ cần chỉnh sửa và gửi lại.</>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setConfirmAction(null)}>Huỷ</Button>
            <Button
              variant={confirmAction?.type === "reject" ? "destructive" : "default"}
              onClick={handleConfirm}
              disabled={approve.isPending || reject.isPending}
            >
              {approve.isPending || reject.isPending ? "Đang xử lý..." : "Xác nhận"}
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

function StatChip({ icon, value, colorClass, label }: {
  icon: ReactNode; value: number; colorClass: string; label: string;
}) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${colorClass}`}>
      {icon}{value} {label}
    </span>
  );
}

function Pagination({ page, totalPages, totalItems, pageSize, onPageChange }: {
  page: number; totalPages: number; totalItems: number; pageSize: number; onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  const from = (page - 1) * pageSize + 1;
  const to   = Math.min(page * pageSize, totalItems);
  return (
    <div className="flex items-center justify-between border-t border-border/50 px-5 py-3">
      <span className="text-xs text-muted-foreground">{from}–{to} / {totalItems}</span>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="min-w-[60px] text-center text-xs text-muted-foreground">{page} / {totalPages}</span>
        <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
