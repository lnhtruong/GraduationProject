"use client";

import { useState, useMemo, type ReactNode } from "react";
import { Clock4, CheckCircle2, XCircle, Flag, BookOpen, PlayCircle, GraduationCap, ChevronLeft, ChevronRight, SlidersHorizontal, ArrowUpDown, AlertTriangle, RefreshCw } from "lucide-react";
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

function sortReports(reports: Report[], order: SortOrder): Report[] {
  return [...reports].sort((a, b) => {
    const ta = new Date(a.created_at).getTime();
    const tb = new Date(b.created_at).getTime();
    return order === "newest" ? tb - ta : ta - tb;
  });
}

export default function AdminReportsPage() {
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [pendingPage, setPendingPage] = useState(1);
  const [allPage, setAllPage] = useState(1);

  const targetType = typeFilter === "all" ? undefined : typeFilter;

  const { data: pendingData, isLoading: isPendingLoading, isError: isPendingError, refetch: refetchPending } = useAdminReports({
    status: "pending",
    targetType,
    page: pendingPage,
    limit: PAGE_SIZE,
  });
  const { data: allData, isLoading: isAllLoading, isError: isAllError, refetch: refetchAll } = useAdminReports({
    targetType,
    page: allPage,
    limit: PAGE_SIZE,
  });
  const { data: approvedData } = useAdminReports({ status: "approved", limit: 1 });
  const { data: rejectedData } = useAdminReports({ status: "rejected", limit: 1 });

  const stats = {
    pending: pendingData?.pagination.totalItems ?? 0,
    approved: approvedData?.pagination.totalItems ?? 0,
    rejected: rejectedData?.pagination.totalItems ?? 0,
  };

  const pendingTotalPages = pendingData?.pagination.totalPages ?? 1;
  const allTotalPages = allData?.pagination.totalPages ?? 1;

  const sortedPending = useMemo(() => sortReports(pendingData?.items ?? [], sortOrder), [pendingData, sortOrder]);
  const sortedAll     = useMemo(() => sortReports(allData?.items     ?? [], sortOrder), [allData,     sortOrder]);

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

        {/* Stat chips */}
        <div className="flex shrink-0 items-center gap-2">
          <StatChip
            icon={<Clock4 className="h-3.5 w-3.5" />}
            value={stats.pending}
            colorClass="text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-400"
            label="chờ"
          />
          <StatChip
            icon={<CheckCircle2 className="h-3.5 w-3.5" />}
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
        {/* Toolbar */}
        <div className="flex flex-col gap-3">
          {/* Row 1: tabs */}
          <TabsList className="h-9 w-fit rounded-lg bg-muted/50 p-0.5">
            <TabsTrigger value="pending" className="h-8 gap-2 rounded-md px-4 text-sm">
              Chờ xử lý
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

          {/* Row 2: filters */}
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
            {(typeFilter !== "all" || sortOrder !== "newest") && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => { setTypeFilter("all"); setSortOrder("newest"); setPendingPage(1); setAllPage(1); }}
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
              <span className="text-xs text-muted-foreground">
                {stats.pending} báo cáo
              </span>
            </div>
            {isPendingError ? (
              <ErrorRetry onRetry={() => refetchPending()} />
            ) : (
              <>
                <AdminReportTable
                  reports={sortedPending}
                  isLoading={isPendingLoading}
                  onViewDetail={setSelectedReport}
                />
                <Pagination
                  page={pendingPage}
                  totalPages={pendingTotalPages}
                  totalItems={stats.pending}
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
              <span className="text-xs text-muted-foreground">
                {allData?.pagination.totalItems ?? 0} báo cáo
              </span>
            </div>
            {isAllError ? (
              <ErrorRetry onRetry={() => refetchAll()} />
            ) : (
              <>
                <AdminReportTable
                  reports={sortedAll}
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

function StatChip({
  icon,
  value,
  colorClass,
  label,
}: {
  icon: ReactNode;
  value: number;
  colorClass: string;
  label: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${colorClass}`}
    >
      {icon}
      {value} {label}
    </span>
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
