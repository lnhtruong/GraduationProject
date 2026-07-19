"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Wallet,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  BookOpen,
  Receipt,
} from "lucide-react";
import {
  useAdminRevenueByCategory,
  useAdminRevenueSummary,
  useAdminRevenueTimeseries,
  useAdminRevenueTransactions,
} from "../../revenue/hooks";
import type {
  RevenueGranularity,
  TransactionStatus,
} from "../../revenue/types";
import { RevenueTrendChart } from "./RevenueTrendChart";

function formatVND(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "—";
  return `${Math.round(amount).toLocaleString("vi-VN")} ₫`;
}

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const RANGE_DAYS: Record<RevenueGranularity, number> = {
  daily: 30,
  weekly: 84,
  monthly: 365,
};

const STATUS_LABEL: Record<TransactionStatus, string> = {
  paid: "Đã thanh toán",
  pending: "Đang chờ",
  failed: "Thất bại",
};

const STATUS_COLOR: Record<TransactionStatus, string> = {
  paid: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30",
  pending: "text-amber-600 bg-amber-50 dark:bg-amber-950/30",
  failed: "text-rose-600 bg-rose-50 dark:bg-rose-950/30",
};

export default function AdminRevenuePage() {
  const [granularity, setGranularity] = useState<RevenueGranularity>("daily");

  const { from, to } = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - (RANGE_DAYS[granularity] - 1));
    return { from: toIsoDate(start), to: toIsoDate(end) };
  }, [granularity]);

  const summaryQ = useAdminRevenueSummary();
  const timeseriesQ = useAdminRevenueTimeseries({ granularity, from, to });
  const categoryQ = useAdminRevenueByCategory(from, to);
  const txQ = useAdminRevenueTransactions({ limit: 10, page: 1 });

  const summary = summaryQ.data;
  const growth = summary?.growthPercent ?? null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border/50 pb-5">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <Wallet className="h-5 w-5 text-primary" />
            Thống kê doanh thu
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Doanh thu toàn nền tảng từ thanh toán khóa học
          </p>
        </div>
        <div className="inline-flex rounded-lg border border-border/60 bg-background p-0.5">
          {(["daily", "weekly", "monthly"] as RevenueGranularity[]).map((g) => (
            <button
              key={g}
              onClick={() => setGranularity(g)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                granularity === g
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {g === "daily" ? "Ngày" : g === "weekly" ? "Tuần" : "Tháng"}
            </button>
          ))}
        </div>
      </div>

      {(summaryQ.isError || timeseriesQ.isError) && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-5 py-4 text-sm text-destructive">
          Một số dữ liệu không thể tải. Vui lòng thử lại sau.
        </div>
      )}

      <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/25 dark:text-amber-100">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Khu vực doanh thu chỉ dành cho admin. Các số liệu hiện là doanh thu
          toàn nền tảng từ giao dịch thành công; nếu hệ thống áp dụng phí nền
          tảng N%, admin cần theo dõi phần phí nền tảng và phần đối soát trả cho
          giảng viên.
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<Wallet className="h-5 w-5" />}
          label="Doanh thu toàn thời gian"
          value={formatVND(summary?.allTime)}
          colorClass="text-blue-600 bg-blue-50 dark:bg-blue-950/30"
          isLoading={summaryQ.isLoading}
        />
        <StatCard
          icon={
            growth !== null && growth < 0 ? (
              <TrendingDown className="h-5 w-5" />
            ) : (
              <TrendingUp className="h-5 w-5" />
            )
          }
          label="Doanh thu tháng này"
          value={formatVND(summary?.thisMonth)}
          colorClass="text-violet-600 bg-violet-50 dark:bg-violet-950/30"
          isLoading={summaryQ.isLoading}
          delta={
            growth === null
              ? undefined
              : `${growth > 0 ? "+" : ""}${growth}% so với tháng trước`
          }
          deltaNegative={growth !== null && growth < 0}
        />
        <StatCard
          icon={<ShoppingCart className="h-5 w-5" />}
          label="Đơn đã thanh toán"
          value={
            summaryQ.isLoading ? "—" : String(summary?.paidOrders ?? 0)
          }
          colorClass="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30"
          isLoading={summaryQ.isLoading}
        />
        <StatCard
          icon={<BookOpen className="h-5 w-5" />}
          label="Lượt mua khóa học"
          value={summaryQ.isLoading ? "—" : String(summary?.coursesSold ?? 0)}
          colorClass="text-sky-600 bg-sky-50 dark:bg-sky-950/30"
          isLoading={summaryQ.isLoading}
        />
      </div>

      {/* Trend chart */}
      <Section title="Xu hướng doanh thu">
        <RevenueTrendChart
          data={timeseriesQ.data ?? []}
          isLoading={timeseriesQ.isLoading}
        />
      </Section>

      {/* Status breakdown */}
      <Section title="Theo trạng thái giao dịch">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {(["paid", "pending", "failed"] as TransactionStatus[]).map((s) => {
            const bucket = summary?.statusBreakdown?.[s];
            return (
              <div
                key={s}
                className="rounded-xl border border-border/60 bg-background p-4 shadow-sm"
              >
                <div
                  className={`mb-3 inline-flex rounded-lg p-2 ${STATUS_COLOR[s]}`}
                >
                  <Receipt className="h-5 w-5" />
                </div>
                <p className="text-xs text-muted-foreground">{STATUS_LABEL[s]}</p>
                <p className="mt-0.5 text-lg font-bold tabular-nums">
                  {formatVND(bucket?.amount)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {bucket?.count ?? 0} giao dịch
                </p>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Top courses + Top instructors */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Section title="Top khóa học theo doanh thu">
          <RankTable
            isLoading={summaryQ.isLoading}
            emptyText="Chưa có khóa học bán được"
            rows={(summary?.topCourses ?? []).map((c) => ({
              key: c.courseId,
              primary: c.courseName,
              secondary: c.instructorName,
              amount: c.revenue,
              count: c.enrollCount,
            }))}
          />
        </Section>
        <Section title="Top giảng viên theo doanh thu">
          <RankTable
            isLoading={summaryQ.isLoading}
            emptyText="Chưa có giảng viên có doanh thu"
            rows={(summary?.topInstructors ?? []).map((i) => ({
              key: i.instructorId,
              primary: i.instructorName || `GV #${i.instructorId}`,
              secondary: `${i.courseCount} khóa học`,
              amount: i.revenue,
              count: i.enrollCount,
            }))}
          />
        </Section>
      </div>

      {/* Category breakdown */}
      <Section title="Doanh thu theo danh mục">
        <RankTable
          isLoading={categoryQ.isLoading}
          emptyText="Chưa có dữ liệu danh mục"
          rows={(categoryQ.data ?? []).map((c) => ({
            key: c.category,
            primary: c.category,
            amount: c.revenue,
            count: c.enrollCount,
          }))}
        />
      </Section>

      {/* Recent transactions */}
      <Section title="Giao dịch gần đây">
        {txQ.isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : (txQ.data?.data.length ?? 0) === 0 ? (
          <div className="rounded-lg border border-dashed py-6 text-center text-xs text-muted-foreground">
            Chưa có giao dịch
          </div>
        ) : (
          <>
            {/* Desktop: bảng đầy đủ, từ sm trở lên */}
            <div className="hidden overflow-hidden rounded-xl border border-border/60 bg-background sm:block">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
                      <th className="px-4 py-2.5 font-medium">Người mua</th>
                      <th className="px-4 py-2.5 font-medium">Số khóa</th>
                      <th className="px-4 py-2.5 text-right font-medium">Tổng tiền</th>
                      <th className="px-4 py-2.5 font-medium">Trạng thái</th>
                      <th className="px-4 py-2.5 font-medium">Thời gian</th>
                    </tr>
                  </thead>
                  <tbody>
                    {txQ.data?.data.map((t) => (
                      <tr
                        key={t.id}
                        className="border-b border-border/40 last:border-b-0 hover:bg-muted/30"
                      >
                        <td className="px-4 py-2.5">
                          {t.buyerName || `User #${t.buyerUserId}`}
                        </td>
                        <td className="px-4 py-2.5 tabular-nums">{t.itemCount}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums font-medium">
                          {formatVND(t.totalAmount)}
                        </td>
                        <td className="px-4 py-2.5">
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_COLOR[t.status]}`}
                          >
                            {STATUS_LABEL[t.status]}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground">
                          {(t.paidAt || t.createdAt || "").replace("T", " ").slice(0, 16)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile: card danh sách, dưới sm */}
            <div className="divide-y divide-border/40 rounded-xl border border-border/60 bg-background sm:hidden">
              {txQ.data?.data.map((t) => (
                <div key={t.id} className="flex flex-col gap-1.5 px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium">
                      {t.buyerName || `User #${t.buyerUserId}`}
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_COLOR[t.status]}`}
                    >
                      {STATUS_LABEL[t.status]}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{t.itemCount} khóa · {formatVND(t.totalAmount)}</span>
                    <span>{(t.paidAt || t.createdAt || "").replace("T", " ").slice(0, 16)}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      {children}
    </section>
  );
}

function StatCard({
  icon,
  label,
  value,
  colorClass,
  isLoading,
  delta,
  deltaNegative,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  colorClass: string;
  isLoading: boolean;
  delta?: string;
  deltaNegative?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-background p-4 shadow-sm">
      <div className={`mb-3 inline-flex rounded-lg p-2 ${colorClass}`}>{icon}</div>
      <p className="text-xs text-muted-foreground">{label}</p>
      {isLoading ? (
        <div className="mt-1 h-7 w-28 animate-pulse rounded bg-muted" />
      ) : (
        <p className="mt-0.5 text-xl font-bold tabular-nums">{value}</p>
      )}
      {delta && !isLoading && (
        <p
          className={`mt-1 text-xs ${deltaNegative ? "text-rose-600" : "text-emerald-600"}`}
        >
          {delta}
        </p>
      )}
    </div>
  );
}

interface RankRow {
  key: string | number;
  primary: string;
  secondary?: string;
  amount: number;
  count: number;
}

function RankTable({
  rows,
  isLoading,
  emptyText,
}: {
  rows: RankRow[];
  isLoading: boolean;
  emptyText: string;
}) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-10 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed py-6 text-center text-xs text-muted-foreground">
        {emptyText}
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-background">
      {rows.map((r, idx) => (
        <div
          key={r.key}
          className="flex items-center gap-3 border-b border-border/40 px-4 py-2.5 last:border-b-0 hover:bg-muted/30"
        >
          <span className="w-5 shrink-0 text-center text-xs font-semibold text-muted-foreground">
            {idx + 1}
          </span>
          <div className="min-w-0 flex-1">
            <p className="line-clamp-1 text-sm font-medium">{r.primary}</p>
            {r.secondary && (
              <p className="line-clamp-1 text-xs text-muted-foreground">
                {r.secondary}
              </p>
            )}
          </div>
          <div className="shrink-0 text-right">
            <p className="text-sm font-semibold tabular-nums">
              {Math.round(r.amount).toLocaleString("vi-VN")} ₫
            </p>
            <p className="text-xs text-muted-foreground">{r.count} lượt</p>
          </div>
        </div>
      ))}
    </div>
  );
}
