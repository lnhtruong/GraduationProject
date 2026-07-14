"use client";

import { useState, useEffect, useRef } from "react";
import { Flag, BookOpen, PlayCircle, GraduationCap, ChevronLeft, ChevronRight, SlidersHorizontal, ArrowUpDown, Search, AlertTriangle, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { AdminReportTable } from "./AdminReportTable";
import { AdminReportReviewModal } from "./AdminReportReviewModal";
import { useAdminReports } from "../../api/admin-reports.hooks";
import type { Report, ReportTargetType } from "../../types/report.types";

type TypeFilter = "all" | ReportTargetType;
type SortOrder = "newest" | "oldest";

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 400;

export default function AdminReportsPage() {
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [pendingPage, setPendingPage] = useState(1);
  const [allPage, setAllPage] = useState(1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setSearch(searchInput); setPendingPage(1); setAllPage(1); }, SEARCH_DEBOUNCE_MS);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchInput]);

  const targetType = typeFilter === "all" ? undefined : typeFilter;
  const serverSortOrder = sortOrder === "newest" ? "desc" : "asc";

  const { data: pendingData, isLoading: isPendingLoading, isError: isPendingError, refetch: refetchPending } = useAdminReports({
    status: "pending",
    targetType,
    page: pendingPage,
    limit: PAGE_SIZE,
    sortOrder: serverSortOrder,
    search: search || undefined,
  });
  const { data: allData, isLoading: isAllLoading, isError: isAllError, refetch: refetchAll } = useAdminReports({
    targetType,
    page: allPage,
    limit: PAGE_SIZE,
    sortOrder: serverSortOrder,
    search: search || undefined,
  });
  const pendingTotalPages = pendingData?.pagination.totalPages ?? 1;
  const allTotalPages = allData?.pagination.totalPages ?? 1;

  const handleTypeFilter = (v: string) => {
    setTypeFilter(v as TypeFilter);
    setPendingPage(1);
    setAllPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-end justify-between gap-4 border-b border-border/50 pb-5">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <Flag className="h-5 w-5 text-primary" />
            Báo cáo vi phạm
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Xem xét và xử lý các báo cáo về giảng viên, khóa học và bài học
          </p>
        </div>

      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending" className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-col gap-3">
          {/* Row 1: tabs */}
          <TabsList className="h-9 w-fit rounded-lg bg-muted/50 p-0.5">
            <TabsTrigger value="pending" className="h-8 gap-2 rounded-md px-4 text-sm">
              Chờ xử lý
            </TabsTrigger>
            <TabsTrigger value="all" className="h-8 rounded-md px-4 text-sm">
              Tất cả
            </TabsTrigger>
          </TabsList>

          {/* Row 2: search */}
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm theo lý do báo cáo..."
              className="h-8 pl-8 text-xs"
            />
          </div>

          {/* Row 3: filters */}
          <div className="flex flex-wrap items-center gap-2">
            <SlidersHorizontal className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />

            {/* Type filter */}
            <Select value={typeFilter} onValueChange={handleTypeFilter}>
              <SelectTrigger size="sm" className="h-8 w-[140px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại</SelectItem>
                <SelectItem value="teacher">
                  <span className="flex items-center gap-1.5">
                    <GraduationCap className="h-3.5 w-3.5 text-orange-500" />Giảng viên
                  </span>
                </SelectItem>
                <SelectItem value="course">
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5 text-blue-500" />Khóa học
                  </span>
                </SelectItem>
                <SelectItem value="lesson">
                  <span className="flex items-center gap-1.5">
                    <PlayCircle className="h-3.5 w-3.5 text-purple-500" />Bài học
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Sort by time */}
            <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as SortOrder)}>
              <SelectTrigger size="sm" className="h-8 w-[150px] text-xs">
                <ArrowUpDown className="mr-1.5 h-3 w-3 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Mới nhất trước</SelectItem>
                <SelectItem value="oldest">Cũ nhất trước</SelectItem>
              </SelectContent>
            </Select>

            {/* Clear filters */}
            {(typeFilter !== "all" || sortOrder !== "newest" || searchInput) && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => { setTypeFilter("all"); setSortOrder("newest"); setSearchInput(""); setSearch(""); setPendingPage(1); setAllPage(1); }}
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
              <span className="text-sm font-semibold">Báo cáo chờ xử lý</span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  {pendingData?.pagination.totalItems ?? 0} báo cáo
                </span>
                <Button
                  variant="ghost" size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => refetchPending()}
                  disabled={isPendingLoading}
                  title="Làm mới"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isPendingLoading ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </div>
            {isPendingError ? (
              <ErrorRetry onRetry={() => refetchPending()} />
            ) : (
              <>
                <AdminReportTable
                  reports={pendingData?.items ?? []}
                  isLoading={isPendingLoading}
                  onViewDetail={setSelectedReport}
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
              <span className="text-sm font-semibold">Tất cả báo cáo</span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  {allData?.pagination.totalItems ?? 0} báo cáo
                </span>
                <Button
                  variant="ghost" size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => refetchAll()}
                  disabled={isAllLoading}
                  title="Làm mới"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isAllLoading ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </div>
            {isAllError ? (
              <ErrorRetry onRetry={() => refetchAll()} />
            ) : (
              <>
                <AdminReportTable
                  reports={allData?.items ?? []}
                  isLoading={isAllLoading}
                  onViewDetail={setSelectedReport}
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

      <AdminReportReviewModal
        report={selectedReport}
        open={selectedReport !== null}
        onClose={() => setSelectedReport(null)}
      />
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

function Pagination({
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
        <span className="min-w-[60px] text-center text-xs text-muted-foreground">
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
