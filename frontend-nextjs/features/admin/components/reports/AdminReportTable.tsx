"use client";

import type { ReactNode } from "react";
import { Eye, Inbox, BookOpen, PlayCircle, GraduationCap } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Report, ReportStatus, ReportTargetType } from "../../types/report.types";

const TARGET_TYPE_CONFIG: Record<ReportTargetType, { label: string; icon: ReactNode; className: string }> = {
  course: {
    label: "Khóa học",
    icon: <BookOpen className="h-3 w-3" />,
    className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800",
  },
  lesson: {
    label: "Bài học",
    icon: <PlayCircle className="h-3 w-3" />,
    className: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-800",
  },
  teacher: {
    label: "Giảng viên",
    icon: <GraduationCap className="h-3 w-3" />,
    className: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800",
  },
};

const STATUS_CONFIG: Record<ReportStatus, { label: string; className: string }> = {
  pending: {
    label: "Chờ xử lý",
    className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800",
  },
  approved: {
    label: "Đã duyệt",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800",
  },
  rejected: {
    label: "Đã từ chối",
    className: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800",
  },
};

function formatDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function reporterName(report: Report): string {
  if (!report.reporter) return `ID #${report.reporterId}`;
  const { firstName, lastName, email } = report.reporter;
  const name = [firstName, lastName].filter(Boolean).join(" ").trim();
  return name || email;
}

interface Props {
  reports: Report[];
  isLoading?: boolean;
  onViewDetail?: (report: Report) => void;
}

export function AdminReportTable({ reports, isLoading, onViewDetail }: Props) {
  if (isLoading) {
    return (
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/20">
            <TableHead className="w-16">#ID</TableHead>
            <TableHead className="w-28">Loại</TableHead>
            <TableHead>Lý do</TableHead>
            <TableHead className="w-40">Người báo cáo</TableHead>
            <TableHead className="w-28">Trạng thái</TableHead>
            <TableHead className="w-28">Ngày tạo</TableHead>
            <TableHead className="w-24 text-right">Hành động</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-4 w-8" /></TableCell>
              <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
              <TableCell><Skeleton className="h-4 w-full" /></TableCell>
              <TableCell><Skeleton className="h-4 w-28" /></TableCell>
              <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
              <TableCell><Skeleton className="h-4 w-20" /></TableCell>
              <TableCell><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
        <Inbox className="h-10 w-10 opacity-30" />
        <p className="text-sm">Không có báo cáo nào</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/20">
          <TableHead className="w-16">#ID</TableHead>
          <TableHead className="w-28">Loại</TableHead>
          <TableHead>Lý do</TableHead>
          <TableHead className="w-40">Người báo cáo</TableHead>
          <TableHead className="w-28">Trạng thái</TableHead>
          <TableHead className="w-28">Ngày tạo</TableHead>
          <TableHead className="w-24 text-right">Hành động</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {reports.map((report) => {
          const typeConfig = TARGET_TYPE_CONFIG[report.targetType];
          const statusConfig = STATUS_CONFIG[report.status];
          return (
            <TableRow
              key={report.id}
              className="cursor-pointer hover:bg-muted/30"
              onClick={() => onViewDetail?.(report)}
            >
              <TableCell className="font-mono text-xs text-muted-foreground">
                #{report.id}
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={`flex w-fit items-center gap-1 text-xs font-medium ${typeConfig.className}`}
                >
                  {typeConfig.icon}
                  {typeConfig.label}
                </Badge>
              </TableCell>
              <TableCell className="max-w-xs">
                <span className="line-clamp-2 text-sm text-foreground/80">
                  {report.reason.length > 80
                    ? report.reason.slice(0, 80) + "…"
                    : report.reason}
                </span>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {reporterName(report)}
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={`text-xs font-medium ${statusConfig.className}`}
                >
                  {statusConfig.label}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(report.created_at)}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 gap-1.5 px-2 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewDetail?.(report);
                  }}
                >
                  <Eye className="h-3.5 w-3.5" />
                  Chi tiết
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
