"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowUpDown,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Flag,
  GraduationCap,
  PlayCircle,
  RefreshCw,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdminReports } from "../../api/admin-reports.hooks";
import type { Report, ReportCategory, ReportTargetType } from "../../types/report.types";
import { AdminReportReviewModal } from "./AdminReportReviewModal";
import { AdminReportTable } from "./AdminReportTable";

type TypeFilter = "all" | ReportTargetType;
type CategoryFilter = "all" | ReportCategory;
type SortOrder = "newest" | "oldest";

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 400;

export default function AdminReportsPage() {
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [pendingPage, setPendingPage] = useState(1);
  const [allPage, setAllPage] = useState(1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(searchInput);
      setPendingPage(1);
      setAllPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchInput]);

  const targetType = typeFilter === "all" ? undefined : typeFilter;
  const reportCategory = categoryFilter === "all" ? undefined : categoryFilter;
  const serverSortOrder = sortOrder === "newest" ? "desc" : "asc";

  const pendingReports = useAdminReports({
    status: "pending",
    targetType,
    reportCategory,
    page: pendingPage,
    limit: PAGE_SIZE,
    sortOrder: serverSortOrder,
    search: search || undefined,
  });

  const allReports = useAdminReports({
    targetType,
    reportCategory,
    page: allPage,
    limit: PAGE_SIZE,
    sortOrder: serverSortOrder,
    search: search || undefined,
  });

  const handleTypeFilter = (value: string) => {
    setTypeFilter(value as TypeFilter);
    setPendingPage(1);
    setAllPage(1);
  };

  const handleCategoryFilter = (value: string) => {
    setCategoryFilter(value as CategoryFilter);
    setPendingPage(1);
    setAllPage(1);
  };

  const clearFilters = () => {
    setTypeFilter("all");
    setCategoryFilter("all");
    setSortOrder("newest");
    setSearchInput("");
    setSearch("");
    setPendingPage(1);
    setAllPage(1);
  };

  const hasFilters = typeFilter !== "all" || categoryFilter !== "all" || sortOrder !== "newest" || searchInput;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 border-b border-border/50 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <Flag className="h-5 w-5 text-primary" />
            Báo cáo vi phạm
          </h1>
          <p className="mt-0.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Xem xét và xử lý các báo cáo về giảng viên, khóa học và bài học.
          </p>
        </div>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <div className="rounded-xl border bg-background p-3 shadow-sm sm:p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <TabsList className="grid h-9 w-full grid-cols-2 rounded-lg bg-muted/50 p-0.5 sm:w-fit">
              <TabsTrigger value="pending" className="h-8 rounded-md px-4 text-sm">
                Chờ xử lý
              </TabsTrigger>
              <TabsTrigger value="all" className="h-8 rounded-md px-4 text-sm">
                Tất cả
              </TabsTrigger>
            </TabsList>

            <div className="relative w-full lg:max-w-xs">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Tìm theo lý do báo cáo..."
                className="h-9 pl-8 text-sm lg:h-8 lg:text-xs"
              />
            </div>
          </div>

          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <SlidersHorizontal className="hidden h-3.5 w-3.5 shrink-0 text-muted-foreground sm:block" />

            <Select value={typeFilter} onValueChange={handleTypeFilter}>
              <SelectTrigger size="sm" className="h-9 w-full text-xs sm:h-8 sm:w-[140px]">
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

            <Select value={categoryFilter} onValueChange={handleCategoryFilter}>
              <SelectTrigger size="sm" className="h-9 w-full text-xs sm:h-8 sm:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả vi phạm</SelectItem>
                <SelectItem value="misleading">Thông tin sai lệch</SelectItem>
                <SelectItem value="copyright">Vi phạm bản quyền</SelectItem>
                <SelectItem value="inappropriate">Nội dung không phù hợp</SelectItem>
                <SelectItem value="spam">Spam hoặc lừa đảo</SelectItem>
                <SelectItem value="harassment">Quấy rối hoặc xúc phạm</SelectItem>
                <SelectItem value="other">Vấn đề khác</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as SortOrder)}>
              <SelectTrigger size="sm" className="h-9 w-full text-xs sm:h-8 sm:w-[150px]">
                <ArrowUpDown className="mr-1.5 h-3 w-3 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Mới nhất trước</SelectItem>
                <SelectItem value="oldest">Cũ nhất trước</SelectItem>
              </SelectContent>
            </Select>

            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-full px-2 text-xs text-muted-foreground hover:text-foreground sm:h-8 sm:w-auto"
                onClick={clearFilters}
              >
                Xóa filter
              </Button>
            )}
          </div>
        </div>

        <TabsContent value="pending" className="mt-0">
          <ReportPanel
            title="Báo cáo chờ xử lý"
            count={pendingReports.data?.pagination.totalItems ?? 0}
            isLoading={pendingReports.isLoading}
            isError={pendingReports.isError}
            onRefresh={() => pendingReports.refetch()}
            reports={pendingReports.data?.items ?? []}
            onViewDetail={setSelectedReport}
            page={pendingPage}
            totalPages={pendingReports.data?.pagination.totalPages ?? 1}
            pageSize={PAGE_SIZE}
            onPageChange={setPendingPage}
          />
        </TabsContent>

        <TabsContent value="all" className="mt-0">
          <ReportPanel
            title="Tất cả báo cáo"
            count={allReports.data?.pagination.totalItems ?? 0}
            isLoading={allReports.isLoading}
            isError={allReports.isError}
            onRefresh={() => allReports.refetch()}
            reports={allReports.data?.items ?? []}
            onViewDetail={setSelectedReport}
            page={allPage}
            totalPages={allReports.data?.pagination.totalPages ?? 1}
            pageSize={PAGE_SIZE}
            onPageChange={setAllPage}
          />
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

function ReportPanel({
  title,
  count,
  isLoading,
  isError,
  onRefresh,
  reports,
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
  reports: Report[];
  onViewDetail: (report: Report) => void;
  page: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-background shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-border/50 px-4 py-3 sm:px-5">
        <span className="text-sm font-semibold">{title}</span>
        <div className="flex shrink-0 items-center gap-3">
          <span className="text-xs text-muted-foreground">{count} báo cáo</span>
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
          <AdminReportTable reports={reports} isLoading={isLoading} onViewDetail={onViewDetail} />
          <Pagination
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
        <span className="min-w-[60px] text-center text-xs text-muted-foreground">
          {page} / {totalPages}
        </span>
        <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
