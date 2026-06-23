"use client";

import { useState, useEffect, useRef, type ReactNode } from "react";
import {
  BookCheck, Clock4, XCircle, Search, ChevronLeft, ChevronRight,
  SlidersHorizontal, AlertTriangle, RefreshCw, DollarSign, X, FileEdit,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { AdminCourseTable } from "./AdminCourseTable";
import { AdminCourseReviewModal } from "./AdminCourseReviewModal";
import { AdminChangeRequestTable } from "../change-requests/AdminChangeRequestTable";
import { AdminChangeRequestReviewModal } from "../change-requests/AdminChangeRequestReviewModal";
import {
  useAdminCoursesPaginated, useAdminCourseStats,
  useApproveCourse, useRejectCourse,
} from "../../api/admin-courses.hooks";
import { useAdminChangeRequests, useReviewChangeRequest } from "../../api/admin-change-requests.hooks";
import type { Course } from "@/features/courses/types";
import type {
  CourseChangeRequest, CourseChangeRequestKind, CourseChangeRequestStatus,
} from "../../types/change-request.types";

// ── Types ─────────────────────────────────────────────────────────────────────

type LevelFilter = "all" | "Beginner" | "Intermediate" | "Advanced";
type KindFilter = "all" | CourseChangeRequestKind;
type CourseStatusFilter = "pending" | "approved" | "rejected" | "all";
type CRStatusFilter = "pending" | "approved" | "rejected" | "all";
type ConfirmCourseAction = { type: "approve" | "reject"; course: Course };
type ConfirmCRAction = { type: "approve" | "reject"; request: CourseChangeRequest };

// ── Constants ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 400;
const PRICE_DEBOUNCE_MS = 600;
const PRICE_MIN = 0;
const PRICE_MAX = 2_000_000;
const PRICE_STEP = 10_000;

const KIND_OPTIONS: { value: KindFilter; label: string }[] = [
  { value: "all", label: "Tất cả loại" },
  { value: "course.update", label: "Cập nhật khoá học" },
  { value: "lesson.create", label: "Thêm bài học" },
  { value: "lesson.update", label: "Sửa bài học" },
  { value: "lesson.delete", label: "Xoá bài học" },
  { value: "quiz.create", label: "Thêm quiz" },
  { value: "quiz.update", label: "Sửa quiz" },
  { value: "quiz.delete", label: "Xoá quiz" },
];

const COURSE_STATUS_OPTIONS: { value: CourseStatusFilter; label: string }[] = [
  { value: "pending", label: "Chờ duyệt" },
  { value: "approved", label: "Đã duyệt" },
  { value: "rejected", label: "Đã từ chối" },
  { value: "all", label: "Tất cả" },
];

const CR_STATUS_OPTIONS: { value: CRStatusFilter; label: string }[] = [
  { value: "pending", label: "Chờ duyệt" },
  { value: "approved", label: "Đã duyệt" },
  { value: "rejected", label: "Đã từ chối" },
  { value: "all", label: "Tất cả" },
];

// ── Price range filter ────────────────────────────────────────────────────────

function formatPriceShort(value: number): string {
  if (value === 0) return "0đ";
  if (value >= 1_000_000) {
    const m = value / 1_000_000;
    return `${m % 1 === 0 ? m : m.toFixed(1)}tr`;
  }
  return `${Math.round(value / 1_000)}k`;
}

function PriceRangeFilter({
  value,
  onChange,
}: {
  value: [number, number];
  onChange: (r: [number, number]) => void;
}) {
  const isActive = value[0] !== PRICE_MIN || value[1] !== PRICE_MAX;
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
    onChange([next, next > value[1] ? Math.min(next + PRICE_STEP, PRICE_MAX) : value[1]]);
  }
  function commitMax(raw: string) {
    setDraftMax(null);
    const n = parseInt(raw.replace(/\D/g, ""), 10);
    const next = isNaN(n) ? PRICE_MAX : clamp(n);
    onChange([next < value[0] ? Math.max(next - PRICE_STEP, PRICE_MIN) : value[0], next]);
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
          {isActive ? `${formatPriceShort(value[0])} – ${formatPriceShort(value[1])}` : "Lọc giá"}
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
                <X className="h-3 w-3" />Đặt lại
              </button>
            )}
          </div>
          <Slider
            min={PRICE_MIN} max={PRICE_MAX} step={PRICE_STEP}
            value={value} onValueChange={(v) => onChange(v as [number, number])}
            className="mt-2"
          />
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <p className="mb-1 text-[10px] text-muted-foreground">Từ (đ)</p>
              <Input
                value={displayMin}
                onChange={(e) => setDraftMin(e.target.value.replace(/\D/g, ""))}
                onBlur={(e) => commitMin(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && commitMin(displayMin)}
                inputMode="numeric" className="h-7 text-xs" placeholder="0"
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
                inputMode="numeric" className="h-7 text-xs" placeholder={String(PRICE_MAX)}
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

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminCoursesPage() {
  // ── Course state ──
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courseStatusFilter, setCourseStatusFilter] = useState<CourseStatusFilter>("pending");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<LevelFilter>("all");
  const [priceSlider, setPriceSlider] = useState<[number, number]>([PRICE_MIN, PRICE_MAX]);
  const [priceCommitted, setPriceCommitted] = useState<[number, number]>([PRICE_MIN, PRICE_MAX]);
  const [coursePage, setCoursePage] = useState(1);
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [confirmCourseAction, setConfirmCourseAction] = useState<ConfirmCourseAction | null>(null);

  // ── Change-request state ──
  const [selectedCR, setSelectedCR] = useState<CourseChangeRequest | null>(null);
  const [crStatusFilter, setCrStatusFilter] = useState<CRStatusFilter>("pending");
  const [crSearchInput, setCrSearchInput] = useState("");
  const [crSearch, setCrSearch] = useState("");
  const [kindFilter, setKindFilter] = useState<KindFilter>("all");
  const [crPage, setCrPage] = useState(1);
  const [confirmCRAction, setConfirmCRAction] = useState<ConfirmCRAction | null>(null);

  // ── Debounce refs ──
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const priceDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const crSearchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => { setSearch(searchInput); setCoursePage(1); }, SEARCH_DEBOUNCE_MS);
    return () => { if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  useEffect(() => {
    if (crSearchDebounceRef.current) clearTimeout(crSearchDebounceRef.current);
    crSearchDebounceRef.current = setTimeout(() => { setCrSearch(crSearchInput); setCrPage(1); }, SEARCH_DEBOUNCE_MS);
    return () => { if (crSearchDebounceRef.current) clearTimeout(crSearchDebounceRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [crSearchInput]);

  const handlePriceChange = (range: [number, number]) => {
    setPriceSlider(range);
    if (priceDebounceRef.current) clearTimeout(priceDebounceRef.current);
    priceDebounceRef.current = setTimeout(() => { setPriceCommitted(range); setCoursePage(1); }, PRICE_DEBOUNCE_MS);
  };

  // ── Course queries ──
  const isPriceFiltered = priceCommitted[0] !== PRICE_MIN || priceCommitted[1] !== PRICE_MAX;
  const serverCourseFilters = {
    search: search || undefined,
    level: levelFilter !== "all" ? levelFilter : undefined,
    minPrice: isPriceFiltered ? priceCommitted[0] : undefined,
    maxPrice: isPriceFiltered && priceCommitted[1] < PRICE_MAX ? priceCommitted[1] : undefined,
    status: courseStatusFilter !== "all" ? courseStatusFilter as "pending" | "approved" | "rejected" : undefined,
  };

  const { data: courseData, isLoading: isCourseLoading, isError: isCourseError, refetch: refetchCourses } =
    useAdminCoursesPaginated({ page: coursePage, limit: PAGE_SIZE, ...serverCourseFilters });

  const { data: pendingStats } = useAdminCourseStats("pending");
  const { data: approvedStats } = useAdminCourseStats("approved");
  const { data: rejectedStats } = useAdminCourseStats("rejected");

  // ── Change-request query (single, server-side filtered) ──
  const { data: crData, isLoading: isCrLoading, isError: isCrError, refetch: refetchCR } =
    useAdminChangeRequests({
      status: crStatusFilter !== "all" ? crStatusFilter as CourseChangeRequestStatus : undefined,
      kind: kindFilter !== "all" ? kindFilter as CourseChangeRequestKind : undefined,
      search: crSearch || undefined,
      page: crPage,
      limit: PAGE_SIZE,
    });

  // ── Stats ──
  const stats = {
    pending: pendingStats?.pagination.totalItems ?? 0,
    approved: approvedStats?.pagination.totalItems ?? 0,
    rejected: rejectedStats?.pagination.totalItems ?? 0,
    crPending: 0,
  };

  // ── Course mutations ──
  const approve = useApproveCourse();
  const reject = useRejectCourse();

  const handleConfirmCourse = async () => {
    if (!confirmCourseAction) return;
    const { course, type } = confirmCourseAction;
    if (type === "approve") {
      setApprovingId(course.id);
      try { await approve.mutateAsync(course.id); toast.success(`Đã duyệt: "${course.name}"`); }
      catch { toast.error("Duyệt thất bại. Vui lòng thử lại."); }
      finally { setApprovingId(null); }
    } else {
      setRejectingId(course.id);
      try { await reject.mutateAsync(course.id); toast.success(`Đã từ chối: "${course.name}"`); }
      catch { toast.error("Từ chối thất bại. Vui lòng thử lại."); }
      finally { setRejectingId(null); }
    }
    setConfirmCourseAction(null);
  };

  // ── Change-request mutations ──
  const reviewCR = useReviewChangeRequest();

  const handleConfirmCR = async () => {
    if (!confirmCRAction) return;
    const { request, type } = confirmCRAction;
    try {
      await reviewCR.mutateAsync({
        requestId: request.id,
        dto: { decision: type === "approve" ? "approved" : "rejected" },
      });
      toast.success(type === "approve" ? "Đã duyệt yêu cầu thay đổi." : "Đã từ chối yêu cầu thay đổi.");
    } catch {
      toast.error("Thao tác thất bại. Vui lòng thử lại.");
    }
    setConfirmCRAction(null);
  };

  const isCourseFiltering = search.trim() !== "" || levelFilter !== "all" || isPriceFiltered;
  const isCrFiltering = crSearch.trim() !== "" || kindFilter !== "all";

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-end justify-between gap-4 border-b border-border/50 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Duyệt khóa học</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Xem xét và phê duyệt khóa học do giảng viên gửi lên</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <StatChip icon={<Clock4 className="h-3.5 w-3.5" />} value={stats.pending} colorClass="text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-400" label="chờ duyệt" />
          <StatChip icon={<BookCheck className="h-3.5 w-3.5" />} value={stats.approved} colorClass="text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-400" label="đã duyệt" />
          <StatChip icon={<XCircle className="h-3.5 w-3.5" />} value={stats.rejected} colorClass="text-destructive bg-destructive/5 border-destructive/20" label="từ chối" />
        </div>
      </div>

      <Tabs defaultValue="courses" className="space-y-4">
        {/* ── Tab list ── */}
        <TabsList className="h-9 rounded-lg bg-muted/50 p-0.5">
          <TabsTrigger value="courses" className="h-8 gap-2 rounded-md px-4 text-sm">
            <BookCheck className="h-3.5 w-3.5" />
            Khóa học
            {stats.pending > 0 && (
              <span className="min-w-4.5 rounded-full bg-amber-500 px-1 py-0.5 text-[10px] font-bold leading-none text-white">
                {stats.pending}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="change-requests" className="h-8 gap-2 rounded-md px-4 text-sm">
            <FileEdit className="h-3.5 w-3.5" />
            Yêu cầu thay đổi
          </TabsTrigger>
        </TabsList>

        {/* ── Tab: Khoá học ── */}
        <TabsContent value="courses" className="mt-0 space-y-4">
          {/* Toolbar */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Tìm theo tên khoá học..."
                  className="h-9 w-64 pl-8 text-sm"
                />
              </div>
              {/* Status tabs inside toolbar */}
              <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-muted/30 p-0.5">
                {COURSE_STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { setCourseStatusFilter(opt.value); setCoursePage(1); }}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                      courseStatusFilter === opt.value
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {opt.label}
                    {opt.value === "pending" && stats.pending > 0 && (
                      <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white leading-none">
                        {stats.pending}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <SlidersHorizontal className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <Select value={levelFilter} onValueChange={(v) => { setLevelFilter(v as LevelFilter); setCoursePage(1); }}>
                <SelectTrigger size="sm" className="h-8 w-[130px] text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả level</SelectItem>
                  <SelectItem value="Beginner">Sơ cấp</SelectItem>
                  <SelectItem value="Intermediate">Trung cấp</SelectItem>
                  <SelectItem value="Advanced">Cao cấp</SelectItem>
                </SelectContent>
              </Select>
              <PriceRangeFilter value={priceSlider} onChange={handlePriceChange} />
              {isCourseFiltering && (
                <Button
                  variant="ghost" size="sm"
                  className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setSearchInput(""); setSearch(""); setLevelFilter("all");
                    setPriceSlider([PRICE_MIN, PRICE_MAX]); setPriceCommitted([PRICE_MIN, PRICE_MAX]);
                    setCoursePage(1);
                  }}
                >
                  Xóa filter
                </Button>
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-border/60 bg-background shadow-sm">
            <div className="flex items-center justify-between border-b border-border/50 px-5 py-3">
              <span className="text-sm font-semibold">
                {COURSE_STATUS_OPTIONS.find((o) => o.value === courseStatusFilter)?.label ?? "Khóa học"}
              </span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  {courseData?.pagination.totalItems ?? 0} khóa học
                </span>
                <Button
                  variant="ghost" size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => refetchCourses()}
                  disabled={isCourseLoading}
                  title="Làm mới"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isCourseLoading ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </div>
            {isCourseError ? (
              <ErrorRetry onRetry={() => refetchCourses()} />
            ) : (
              <>
                <AdminCourseTable
                  courses={courseData?.data ?? []}
                  isLoading={isCourseLoading}
                  isFiltering={isCourseFiltering}
                  showActions={courseStatusFilter === "pending"}
                  approvingId={approvingId}
                  rejectingId={rejectingId}
                  onApprove={(c) => setConfirmCourseAction({ type: "approve", course: c })}
                  onReject={(c) => setConfirmCourseAction({ type: "reject", course: c })}
                  onViewDetail={setSelectedCourse}
                />
                <Pagination
                  page={coursePage}
                  totalPages={courseData?.pagination.totalPages ?? 1}
                  totalItems={courseData?.pagination.totalItems ?? 0}
                  pageSize={PAGE_SIZE}
                  onPageChange={setCoursePage}
                />
              </>
            )}
          </div>
        </TabsContent>

        {/* ── Tab: Yêu cầu thay đổi ── */}
        <TabsContent value="change-requests" className="mt-0 space-y-4">
          {/* Toolbar */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={crSearchInput}
                  onChange={(e) => setCrSearchInput(e.target.value)}
                  placeholder="Tìm theo tên khoá học..."
                  className="h-9 w-64 pl-8 text-sm"
                />
              </div>
              {/* Status toggle */}
              <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-muted/30 p-0.5">
                {CR_STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { setCrStatusFilter(opt.value); setCrPage(1); }}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                      crStatusFilter === opt.value
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <SlidersHorizontal className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <Select value={kindFilter} onValueChange={(v) => { setKindFilter(v as KindFilter); setCrPage(1); }}>
                <SelectTrigger size="sm" className="h-8 w-[175px] text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {KIND_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
              {isCrFiltering && (
                <Button
                  variant="ghost" size="sm"
                  className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => { setCrSearchInput(""); setCrSearch(""); setKindFilter("all"); setCrPage(1); }}
                >
                  Xóa filter
                </Button>
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-border/60 bg-background shadow-sm">
            <div className="flex items-center justify-between border-b border-border/50 px-5 py-3">
              <span className="text-sm font-semibold">
                {CR_STATUS_OPTIONS.find((o) => o.value === crStatusFilter)?.label ?? "Yêu cầu thay đổi"}
              </span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  {crData?.total ?? 0} yêu cầu
                </span>
                <Button
                  variant="ghost" size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => refetchCR()}
                  disabled={isCrLoading}
                  title="Làm mới"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isCrLoading ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </div>
            {isCrError ? (
              <ErrorRetry onRetry={() => refetchCR()} />
            ) : (
              <>
                <AdminChangeRequestTable
                  requests={crData?.data ?? []}
                  isLoading={isCrLoading}
                  isFiltering={isCrFiltering}
                  onApprove={(r) => setConfirmCRAction({ type: "approve", request: r })}
                  onReject={(r) => setConfirmCRAction({ type: "reject", request: r })}
                  onViewDetail={setSelectedCR}
                />
                <Pagination
                  page={crPage}
                  totalPages={crData ? Math.ceil(crData.total / PAGE_SIZE) : 1}
                  totalItems={crData?.total ?? 0}
                  pageSize={PAGE_SIZE}
                  onPageChange={setCrPage}
                />
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Modals ── */}
      <AdminCourseReviewModal
        course={selectedCourse}
        open={selectedCourse !== null}
        onClose={() => setSelectedCourse(null)}
      />

      <AdminChangeRequestReviewModal
        request={selectedCR}
        open={selectedCR !== null}
        onClose={() => setSelectedCR(null)}
      />

      {/* Confirm course action */}
      <Dialog open={!!confirmCourseAction} onOpenChange={(o) => !o && setConfirmCourseAction(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              {confirmCourseAction?.type === "approve" ? "Duyệt khóa học" : "Từ chối khóa học"}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {confirmCourseAction?.type === "approve"
                ? <>Bạn có chắc muốn <strong>duyệt</strong> khóa học <strong>"{confirmCourseAction.course.name}"</strong>?</>
                : <>Bạn có chắc muốn <strong>từ chối</strong> khóa học <strong>"{confirmCourseAction?.course.name}"</strong>? Giảng viên sẽ cần chỉnh sửa và gửi lại.</>}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setConfirmCourseAction(null)}>Huỷ</Button>
            <Button
              variant={confirmCourseAction?.type === "reject" ? "destructive" : "default"}
              onClick={handleConfirmCourse}
              disabled={approve.isPending || reject.isPending}
            >
              {approve.isPending || reject.isPending ? "Đang xử lý..." : "Xác nhận"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm change-request action */}
      <Dialog open={!!confirmCRAction} onOpenChange={(o) => !o && setConfirmCRAction(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              {confirmCRAction?.type === "approve" ? "Duyệt yêu cầu thay đổi" : "Từ chối yêu cầu thay đổi"}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {confirmCRAction?.type === "approve"
                ? <>Xác nhận <strong>duyệt</strong> yêu cầu thay đổi trên khoá học <strong>"{confirmCRAction.request.course?.name}"</strong>? Thay đổi sẽ được áp dụng ngay.</>
                : <>Xác nhận <strong>từ chối</strong> yêu cầu này? Giảng viên sẽ được thông báo.</>}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setConfirmCRAction(null)}>Huỷ</Button>
            <Button
              variant={confirmCRAction?.type === "reject" ? "destructive" : "default"}
              onClick={handleConfirmCR}
              disabled={reviewCR.isPending}
            >
              {reviewCR.isPending ? "Đang xử lý..." : "Xác nhận"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Shared helpers ────────────────────────────────────────────────────────────

function ErrorRetry({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
      <AlertTriangle className="h-8 w-8 text-destructive/60" />
      <p className="text-sm text-muted-foreground">Không thể tải dữ liệu</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RefreshCw className="mr-2 h-3.5 w-3.5" />Thử lại
      </Button>
    </div>
  );
}

function StatChip({
  icon, value, colorClass, label,
}: {
  icon: ReactNode; value: number; colorClass: string; label: string;
}) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${colorClass}`}>
      {icon}{value} {label}
    </span>
  );
}

function Pagination({
  page, totalPages, totalItems, pageSize, onPageChange,
}: {
  page: number; totalPages: number; totalItems: number; pageSize: number; onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);
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
