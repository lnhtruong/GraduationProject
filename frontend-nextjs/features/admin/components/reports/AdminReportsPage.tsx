"use client";

import { useState, useMemo } from "react";
import { Search, Clock4, CheckCircle2, XCircle, Flag, BookOpen, PlayCircle, GraduationCap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdminReportTable } from "./AdminReportTable";
import { AdminReportReviewModal } from "./AdminReportReviewModal";
import { useAdminReports } from "../../api/admin-reports.hooks";
import type { Report, ReportTargetType } from "../../types/report.types";

type TypeFilter = "all" | ReportTargetType;

export default function AdminReportsPage() {
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");

  const { data: pendingData, isLoading: isPendingLoading } = useAdminReports({
    status: "pending",
    limit: 100,
  });
  const { data: allData, isLoading: isAllLoading } = useAdminReports({ limit: 100 });
  const { data: approvedData } = useAdminReports({ status: "approved", limit: 1 });
  const { data: rejectedData } = useAdminReports({ status: "rejected", limit: 1 });

  const pendingReports = pendingData?.items ?? [];
  const allReports = allData?.items ?? [];

  const stats = useMemo(() => ({
    pending: pendingData?.pagination.totalItems ?? 0,
    approved: approvedData?.pagination.totalItems ?? 0,
    rejected: rejectedData?.pagination.totalItems ?? 0,
  }), [pendingData, approvedData, rejectedData]);

  function applyFilters(list: Report[]) {
    const keyword = search.trim().toLowerCase();
    return list.filter((r) => {
      const bySearch =
        !keyword ||
        r.reason.toLowerCase().includes(keyword) ||
        String(r.id).includes(keyword) ||
        String(r.targetId).includes(keyword);
      const byType = typeFilter === "all" || r.targetType === typeFilter;
      return bySearch && byType;
    });
  }

  const filteredPending = useMemo(
    () => applyFilters(pendingReports),
    [pendingReports, search, typeFilter],
  );
  const filteredAll = useMemo(
    () => applyFilters(allReports),
    [allReports, search, typeFilter],
  );

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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TabsList className="h-9 rounded-lg bg-muted/50 p-0.5">
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

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo lý do, ID..."
                className="h-9 w-52 pl-8 text-sm"
              />
            </div>
            <Select
              value={typeFilter}
              onValueChange={(v) => setTypeFilter(v as TypeFilter)}
            >
              <SelectTrigger size="sm" className="h-9 w-36 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại</SelectItem>
                <SelectItem value="teacher">
                  <span className="flex items-center gap-1.5">
                    <GraduationCap className="h-3.5 w-3.5 text-orange-500" />
                    Giảng viên
                  </span>
                </SelectItem>
                <SelectItem value="course">
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5 text-blue-500" />
                    Khóa học
                  </span>
                </SelectItem>
                <SelectItem value="lesson">
                  <span className="flex items-center gap-1.5">
                    <PlayCircle className="h-3.5 w-3.5 text-purple-500" />
                    Bài học
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tab: pending */}
        <TabsContent value="pending" className="mt-0">
          <div className="overflow-hidden rounded-xl border border-border/60 bg-background shadow-sm">
            <div className="flex items-center justify-between border-b border-border/50 px-5 py-3">
              <span className="text-sm font-semibold">Báo cáo chờ xử lý</span>
              <span className="text-xs text-muted-foreground">
                {filteredPending.length} báo cáo
              </span>
            </div>
            <AdminReportTable
              reports={filteredPending}
              isLoading={isPendingLoading}
              onViewDetail={setSelectedReport}
            />
          </div>
        </TabsContent>

        {/* Tab: all */}
        <TabsContent value="all" className="mt-0">
          <div className="overflow-hidden rounded-xl border border-border/60 bg-background shadow-sm">
            <div className="flex items-center justify-between border-b border-border/50 px-5 py-3">
              <span className="text-sm font-semibold">Tất cả báo cáo</span>
              <span className="text-xs text-muted-foreground">
                {filteredAll.length} báo cáo
              </span>
            </div>
            <AdminReportTable
              reports={filteredAll}
              isLoading={isAllLoading}
              onViewDetail={setSelectedReport}
            />
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

function StatChip({
  icon,
  value,
  colorClass,
  label,
}: {
  icon: React.ReactNode;
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
