"use client";

import {
  BookOpen,
  Users,
  Flag,
  BarChart3,
  Clock4,
  CheckCircle2,
  GraduationCap,
  ShieldCheck,
  GitPullRequestArrow,
} from "lucide-react";
import { useAdminDashboardStats } from "../../api/admin-dashboard.hooks";

export default function AdminDashboardPage() {
  const { data, isLoading, isError } = useAdminDashboardStats();

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="border-b border-border/50 pb-5">
        <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight">
          <BarChart3 className="h-5 w-5 text-primary" />
          Tổng quan hệ thống
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Thống kê toàn bộ hoạt động trên nền tảng
        </p>
      </div>

      {isError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-5 py-4 text-sm text-destructive">
          Một số dữ liệu không thể tải. Vui lòng thử lại sau.
        </div>
      )}

      {/* Widget 1 — Khóa học */}
      <section className="space-y-3">
        <SectionLabel icon={<BookOpen className="h-4 w-4" />} label="Khóa học" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            icon={<BookOpen className="h-5 w-5" />}
            label="Tổng số khóa học"
            value={data?.courses.total ?? undefined}
            colorClass="text-blue-600 bg-blue-50 dark:bg-blue-950/30"
            isLoading={isLoading}
          />
          <StatCard
            icon={<Clock4 className="h-5 w-5" />}
            label="Chờ duyệt"
            value={data?.courses.pending ?? undefined}
            colorClass="text-amber-600 bg-amber-50 dark:bg-amber-950/30"
            isLoading={isLoading}
          />
          <StatCard
            icon={<CheckCircle2 className="h-5 w-5" />}
            label="Đợi xuất bản"
            value={data?.courses.approved ?? undefined}
            colorClass="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30"
            isLoading={isLoading}
          />
        </div>
      </section>

      {/* Widget 2 — Change Requests */}
      <section className="space-y-3">
        <SectionLabel icon={<GitPullRequestArrow className="h-4 w-4" />} label="Yêu cầu thay đổi" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            icon={<Clock4 className="h-5 w-5" />}
            label="Chờ duyệt"
            value={data?.changeRequests.pending ?? undefined}
            colorClass="text-amber-600 bg-amber-50 dark:bg-amber-950/30"
            isLoading={isLoading}
          />
          <StatCard
            icon={<CheckCircle2 className="h-5 w-5" />}
            label="Đã duyệt"
            value={data?.changeRequests.approved ?? undefined}
            colorClass="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30"
            isLoading={isLoading}
          />
          <StatCard
            icon={<Flag className="h-5 w-5" />}
            label="Đã từ chối"
            value={data?.changeRequests.rejected ?? undefined}
            colorClass="text-rose-600 bg-rose-50 dark:bg-rose-950/30"
            isLoading={isLoading}
          />
        </div>
      </section>

      {/* Widget 4 — Người dùng */}
      <section className="space-y-3">
        <SectionLabel icon={<Users className="h-4 w-4" />} label="Người dùng" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            icon={<Users className="h-5 w-5" />}
            label="Tổng người dùng"
            value={data?.users.total ?? undefined}
            colorClass="text-violet-600 bg-violet-50 dark:bg-violet-950/30"
            isLoading={isLoading}
          />
          <StatCard
            icon={<GraduationCap className="h-5 w-5" />}
            label="Học viên"
            value={data?.users.students ?? undefined}
            colorClass="text-sky-600 bg-sky-50 dark:bg-sky-950/30"
            isLoading={isLoading}
          />
          <StatCard
            icon={<ShieldCheck className="h-5 w-5" />}
            label="Giảng viên"
            value={data?.users.lecturers ?? undefined}
            colorClass="text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30"
            isLoading={isLoading}
          />
        </div>
      </section>

      {/* Widget 5 — Báo cáo vi phạm */}
      <section className="space-y-3">
        <SectionLabel icon={<Flag className="h-4 w-4" />} label="Báo cáo vi phạm" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            icon={<Flag className="h-5 w-5" />}
            label="Báo cáo chờ xử lý"
            value={data?.pendingReports ?? undefined}
            colorClass="text-rose-600 bg-rose-50 dark:bg-rose-950/30"
            isLoading={isLoading}
          />
        </div>
      </section>
    </div>
  );
}

function SectionLabel({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
      <span className="text-muted-foreground">{icon}</span>
      {label}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  colorClass,
  isLoading,
  suffix,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string | undefined;
  colorClass: string;
  isLoading: boolean;
  suffix?: string;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-background p-4 shadow-sm">
      <div className={`mb-3 inline-flex rounded-lg p-2 ${colorClass}`}>{icon}</div>
      <p className="text-xs text-muted-foreground">{label}</p>
      {isLoading ? (
        <div className="mt-1 h-7 w-20 animate-pulse rounded bg-muted" />
      ) : (
        <p className="mt-0.5 text-2xl font-bold tabular-nums">
          {value ?? "—"}
          {suffix && <span className="ml-1 text-sm font-normal text-muted-foreground">{suffix}</span>}
        </p>
      )}
    </div>
  );
}
