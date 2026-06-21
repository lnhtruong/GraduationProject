"use client";

import { useState, useEffect, useRef } from "react";
import { Search, ChevronLeft, ChevronRight, SlidersHorizontal, AlertTriangle, RefreshCw, DollarSign, X } from "lucide-react";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
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
  useApproveCourse,
  useRejectCourse,
} from "../../api/admin-courses.hooks";
import type { Course } from "@/features/courses/types";

type LevelFilter = "all" | "Beginner" | "Intermediate" | "Advanced";

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 400;
const PRICE_DEBOUNCE_MS = 600;
const PRICE_MIN = 0;
const PRICE_MAX = 2_000_000;
const PRICE_STEP = 10_000;

function formatPriceShort(value: number): string {
  if (value === 0) return "0đ";
  if (value >= 1_000_000) {
    const m = value / 1_000_000;
    return `${m % 1 === 0 ? m : m.toFixed(1)}tr`;
  }
  return `${Math.round(value / 1_000)}k`;
}

type ConfirmAction = { type: "approve"; course: Course } | { type: "reject"; course: Course };

// ── Price range filter component ─────────────────────────────────────────────

interface PriceRangeFilterProps {
  value: [number, number];
  onChange: (range: [number, number]) => void;
}

function PriceRangeFilter({ value, onChange }: PriceRangeFilterProps) {
  const isActive = value[0] !== PRICE_MIN || value[1] !== PRICE_MAX;

  // Draft strings only live while the input is focused — no useEffect needed.
  // When blurred, the input renders directly from the committed `value` prop.
  const [draftMin, setDraftMin] = useState<string | null>(null);
  const [draftMax, setDraftMax] = useState<string | null>(null);

  const displayMin = draftMin ?? String(value[0]);
  const displayMax = draftMax ?? String(value[1]);

  function clamp(n: number) {
    return Math.min(PRICE_MAX, Math.max(PRICE_MIN, Math.round(n / PRICE_STEP) * PRICE_STEP));
  }

  function commitMin(raw: string) {
    setDraftMin(null);
    const n = parseInt(raw.replace(/\D/g, ""), 10);
    const next = isNaN(n) ? PRICE_MIN : clamp(n);
    const nextMax = next > value[1] ? Math.min(next + PRICE_STEP, PRICE_MAX) : value[1];
    onChange([next, nextMax]);
  }

  function commitMax(raw: string) {
    setDraftMax(null);
    const n = parseInt(raw.replace(/\D/g, ""), 10);
    const next = isNaN(n) ? PRICE_MAX : clamp(n);
    const nextMin = next < value[0] ? Math.max(next - PRICE_STEP, PRICE_MIN) : value[0];
    onChange([nextMin, next]);
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`h-8 gap-1.5 px-3 text-xs ${isActive ? "border-primary/50 bg-primary/5 text-primary" : "text-muted-foreground"}`}
        >
          <DollarSign className="h-3 w-3" />
          {isActive
            ? `${formatPriceShort(value[0])} – ${formatPriceShort(value[1])}`
            : "Lọc giá"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-4" align="start">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-foreground">Khoảng giá</p>
            {isActive && (
              <button
                type="button"
                onClick={() => onChange([PRICE_MIN, PRICE_MAX])}
                className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-3 w-3" />
                Đặt lại
              </button>
            )}
          </div>

          <Slider
            min={PRICE_MIN}
            max={PRICE_MAX}
            step={PRICE_STEP}
            value={value}
            onValueChange={(v) => onChange(v as [number, number])}
            className="mt-2"
          />

          {/* Manual input row */}
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <p className="mb-1 text-[10px] text-muted-foreground">Từ (đ)</p>
              <Input
                value={displayMin}
                onChange={(e) => setDraftMin(e.target.value.replace(/\D/g, ""))}
                onBlur={(e) => commitMin(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && commitMin(displayMin)}
                inputMode="numeric"
                className="h-7 text-xs"
                placeholder="0"
              />
            </div>
            <span className="mt-4 text-muted-foreground">–</span>
            <div className="flex-1">
              <p className="mb-1 text-[10px] text-muted-foreground">Đến (đ)</p>
              <Input
                value={displayMax}
                onChange={(e) => setDraftMax(e.target.value.replace(/\D/g, ""))}
                onBlur={(e) => commitMax(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && commitMax(displayMax)}
                inputMode="numeric"
                className="h-7 text-xs"
                placeholder={String(PRICE_MAX)}
              />
            </div>
          </div>

          <p className="text-[10px] text-muted-foreground">
            Bước nhảy {formatPriceShort(PRICE_STEP)} · Tối đa {formatPriceShort(PRICE_MAX)}
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function AdminCoursesPage() {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<LevelFilter>("all");
  // slider state (immediate) vs committed state (debounced → API)
  const [priceSlider, setPriceSlider] = useState<[number, number]>([PRICE_MIN, PRICE_MAX]);
  const [priceCommitted, setPriceCommitted] = useState<[number, number]>([PRICE_MIN, PRICE_MAX]);
  const [pendingPage, setPendingPage] = useState(1);
  const [allPage, setAllPage] = useState(1);
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const priceDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => { setSearch(searchInput); resetPages(); }, SEARCH_DEBOUNCE_MS);
    return () => { if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const handlePriceChange = (range: [number, number]) => {
    setPriceSlider(range);
    if (priceDebounceRef.current) clearTimeout(priceDebounceRef.current);
    priceDebounceRef.current = setTimeout(() => {
      setPriceCommitted(range);
      resetPages();
    }, PRICE_DEBOUNCE_MS);
  };

  const isPriceFiltered = priceCommitted[0] !== PRICE_MIN || priceCommitted[1] !== PRICE_MAX;

  const serverFilters = {
    search: search || undefined,
    level: levelFilter !== "all" ? levelFilter : undefined,
    minPrice: isPriceFiltered ? priceCommitted[0] : undefined,
    maxPrice: isPriceFiltered && priceCommitted[1] < PRICE_MAX ? priceCommitted[1] : undefined,
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

  const pendingTotalPages = pendingData?.pagination.totalPages ?? 1;
  const allTotalPages     = allData?.pagination.totalPages     ?? 1;

  function resetPages() {
    setPendingPage(1);
    setAllPage(1);
  }

  const isFiltering = search.trim() !== "" || levelFilter !== "all" || isPriceFiltered;

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

  const handleClearFilters = () => {
    setSearchInput("");
    setSearch("");
    setLevelFilter("all");
    setPriceSlider([PRICE_MIN, PRICE_MAX]);
    setPriceCommitted([PRICE_MIN, PRICE_MAX]);
    resetPages();
  };

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

            {/* Price range filter */}
            <PriceRangeFilter value={priceSlider} onChange={handlePriceChange} />

            {/* Clear filters */}
            {isFiltering && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                onClick={handleClearFilters}
              >
                Xóa filter
              </Button>
            )}
          </div>
        </div>

        {/* Tab: pending */}
        <TabsContent value="pending" className="mt-0">
          <div className="overflow-hidden rounded-xl border border-border/60 bg-background shadow-sm">
            <div className="border-b border-border/50 px-5 py-3">
              <span className="text-sm font-semibold">Khóa học chờ duyệt</span>
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
