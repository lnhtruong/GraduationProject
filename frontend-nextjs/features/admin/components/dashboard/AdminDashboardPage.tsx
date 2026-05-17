"use client";

import { BookOpen, Users, CheckCircle2, TrendingUp, Star, Clock4, BarChart3, Award } from "lucide-react";
import { useAdminDashboardStats } from "../../api/admin-dashboard.hooks";

export default function AdminDashboardPage() {
  const { data, isLoading, isError } = useAdminDashboardStats();
  const summary = data?.summary;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="border-b border-border/50 pb-5">
        <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight">
          <BarChart3 className="h-5 w-5 text-primary" />
          Tổng quan hệ thống
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Thống kê toàn bộ hoạt động học tập trên nền tảng
        </p>
      </div>

      {isError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-5 py-4 text-sm text-destructive">
          Không thể tải dữ liệu thống kê. Vui lòng thử lại sau.
        </div>
      )}

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={<BookOpen className="h-5 w-5" />}
          label="Khóa học"
          value={summary?.totalCourses}
          colorClass="text-blue-600 bg-blue-50 dark:bg-blue-950/30"
          isLoading={isLoading}
        />
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Lượt đăng ký"
          value={summary?.totalEnrollments}
          colorClass="text-violet-600 bg-violet-50 dark:bg-violet-950/30"
          isLoading={isLoading}
        />
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Hoàn thành"
          value={summary?.completedEnrollments}
          colorClass="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30"
          isLoading={isLoading}
        />
        <StatCard
          icon={<Star className="h-5 w-5" />}
          label="Đánh giá TB"
          value={summary?.averageRating != null ? summary.averageRating.toFixed(1) : undefined}
          colorClass="text-amber-600 bg-amber-50 dark:bg-amber-950/30"
          isLoading={isLoading}
          suffix="/ 5"
        />
      </div>

      {/* Secondary metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricRow
          label="Tỷ lệ hoàn thành"
          value={summary?.completionRate != null ? `${summary.completionRate.toFixed(1)}%` : undefined}
          icon={<Award className="h-4 w-4 text-emerald-500" />}
          isLoading={isLoading}
        />
        <MetricRow
          label="Tiến độ trung bình"
          value={summary?.averageProgress != null ? `${summary.averageProgress.toFixed(1)}%` : undefined}
          icon={<TrendingUp className="h-4 w-4 text-blue-500" />}
          isLoading={isLoading}
        />
        <MetricRow
          label="Đang học"
          value={summary?.activeEnrollments}
          icon={<Clock4 className="h-4 w-4 text-amber-500" />}
          isLoading={isLoading}
        />
      </div>

      {/* Per-course breakdown table */}
      {!isLoading && data?.courses && data.courses.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-border/60 bg-background shadow-sm">
          <div className="flex items-center justify-between border-b border-border/50 px-5 py-3">
            <span className="text-sm font-semibold">Chi tiết theo khóa học</span>
            <span className="text-xs text-muted-foreground">{data.courses.length} khóa học</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40 bg-muted/30 text-xs text-muted-foreground">
                  <th className="px-5 py-2.5 text-left font-medium">Khóa học</th>
                  <th className="px-4 py-2.5 text-right font-medium">Đăng ký</th>
                  <th className="px-4 py-2.5 text-right font-medium">Hoàn thành</th>
                  <th className="px-4 py-2.5 text-right font-medium">Tỷ lệ HT</th>
                  <th className="px-4 py-2.5 text-right font-medium">Tiến độ TB</th>
                  <th className="px-4 py-2.5 text-right font-medium">Đánh giá</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {data.courses.map((course) => (
                  <tr key={course.courseId} className="hover:bg-muted/20 transition-colors">
                    <td className="max-w-xs truncate px-5 py-3 font-medium">{course.courseName}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{course.enrollment.total}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{course.enrollment.completed}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      <span className={course.enrollment.completionRate >= 70 ? "text-emerald-600" : course.enrollment.completionRate >= 40 ? "text-amber-600" : "text-muted-foreground"}>
                        {course.enrollment.completionRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {course.enrollment.averageProgress.toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {course.ratings.totalReviews > 0 ? (
                        <span className="inline-flex items-center gap-1">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          {course.ratings.averageRating.toFixed(1)}
                          <span className="text-muted-foreground">({course.ratings.totalReviews})</span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="overflow-hidden rounded-xl border border-border/60 bg-background shadow-sm">
          <div className="border-b border-border/50 px-5 py-3">
            <div className="h-4 w-36 animate-pulse rounded bg-muted" />
          </div>
          <div className="space-y-px p-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded bg-muted/40" style={{ animationDelay: `${i * 80}ms` }} />
            ))}
          </div>
        </div>
      )}
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

function MetricRow({
  label,
  value,
  icon,
  isLoading,
}: {
  label: string;
  value: number | string | undefined;
  icon: React.ReactNode;
  isLoading: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background px-4 py-3 shadow-sm">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        {label}
      </div>
      {isLoading ? (
        <div className="h-5 w-16 animate-pulse rounded bg-muted" />
      ) : (
        <span className="text-sm font-semibold tabular-nums">{value ?? "—"}</span>
      )}
    </div>
  );
}
