"use client";

import { BadgePercent, BookOpen, ReceiptText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { RevenueSummary } from "../../revenue/types";

function formatVND(amount: number): string {
  return `${Math.round(amount).toLocaleString("vi-VN")} ₫`;
}

function formatPercent(value: number | null | undefined): string {
  if (value == null) return "N%";
  return `${Number.isInteger(value) ? value : Number(value.toFixed(2))}%`;
}

interface StatProps {
  label: string;
  value: string;
  sub?: React.ReactNode;
  accent?: boolean;
  className?: string;
}

function Stat({ label, value, sub, accent, className }: StatProps) {
  return (
    <div className={`bg-background px-5 py-4 ${className ?? ""}`}>
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={`mt-1 text-2xl font-bold tabular-nums leading-none ${
          accent ? "text-primary" : ""
        }`}
      >
        {value}
      </p>
      {sub && <div className="mt-1.5">{sub}</div>}
    </div>
  );
}

interface Props {
  data: RevenueSummary | undefined;
  isLoading: boolean;
}

export function RevenueSummaryCards({ data, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-px bg-border/30 sm:grid-cols-6 lg:grid-cols-5">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`space-y-2 bg-background px-5 py-4 ${
              i < 3 ? "sm:col-span-2 lg:col-span-1" : "sm:col-span-3 lg:col-span-1"
            } ${i === 4 ? "col-span-2" : ""}`}
          >
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-28" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    );
  }

  const courseCount = data?.courses.length ?? 0;
  const netRevenue = data?.netRevenue ?? data?.allTime ?? 0;
  const platformFee = data?.platformFeeAmount ?? 0;
  const taxAmount = data?.taxAmount ?? 0;
  const vatAmount = data?.vatAmount ?? 0;
  const pitAmount = data?.pitAmount ?? 0;

  return (
    <div className="grid grid-cols-2 gap-px bg-border/30 sm:grid-cols-6 lg:grid-cols-5">
      <Stat
        label="Tạm thực nhận"
        value={data ? formatVND(netRevenue) : "—"}
        className="sm:col-span-2 lg:col-span-1"
        accent
        sub={<span className="text-[11px] text-muted-foreground/60">sau phí và thuế</span>}
      />
      <Stat
        label="Doanh thu gốc"
        value={data ? formatVND(data.allTime) : "—"}
        className="sm:col-span-2 lg:col-span-1"
        sub={
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/60">
            <ReceiptText className="h-3 w-3" />
            trước phí và thuế
          </span>
        }
      />
      <Stat
        label={`Phí nền tảng ${formatPercent(data?.platformFeePercent)}`}
        value={data ? formatVND(platformFee) : "—"}
        className="sm:col-span-2 lg:col-span-1"
        sub={<span className="text-[11px] text-muted-foreground/60">hoa hồng hệ thống</span>}
      />
      <Stat
        label="Tạm khấu trừ thuế"
        value={data ? formatVND(taxAmount) : "—"}
        className="sm:col-span-3 lg:col-span-1"
        sub={
          <span className="inline-flex items-start gap-1 text-[11px] text-muted-foreground/60">
            <BadgePercent className="mt-0.5 h-3 w-3 shrink-0" />
            <span className="inline-flex flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-1">
              <span>GTGT {formatVND(vatAmount)}</span>
              <span className="hidden sm:inline">·</span>
              <span>TNCN {formatVND(pitAmount)}</span>
            </span>
          </span>
        }
      />
      <Stat
        label="Khoá có doanh thu"
        value={String(courseCount)}
        className="col-span-2 sm:col-span-3 lg:col-span-1"
        sub={
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/60">
            <BookOpen className="h-3 w-3" />
            trong kỳ đã chọn
          </span>
        }
      />
    </div>
  );
}