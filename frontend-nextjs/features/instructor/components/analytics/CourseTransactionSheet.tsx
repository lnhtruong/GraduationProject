"use client";

import { useState } from "react";
import { AlertCircle, RefreshCw, User } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useCourseTransactionItems } from "../../revenue/hooks";
import type { CourseRevenueSummary } from "../../revenue/types";

function formatVND(amount: number): string {
  return `${amount.toLocaleString("vi-VN")}đ`;
}

function formatDateTime(raw: string): string {
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})([ T](\d{2}):(\d{2}))?/);
  if (!match) return raw;
  const date = `${match[3]}/${match[2]}/${match[1]}`;
  if (match[5]) return `${date} ${match[5]}:${match[6]}`;
  return date;
}

// Default range: tháng hiện tại
function defaultDateRange(): { from: string; to: string } {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const pad = (n: number) => String(n).padStart(2, "0");
  const from = `${y}-${pad(m + 1)}-01`;
  const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const to = `${y}-${pad(m + 1)}-${pad(lastDay)}`;
  return { from, to };
}

interface Props {
  course: CourseRevenueSummary | null;
  open: boolean;
  onClose: () => void;
}

export function CourseTransactionSheet({ course, open, onClose }: Props) {
  const def = defaultDateRange();
  const [from, setFrom] = useState(def.from);
  const [to, setTo] = useState(def.to);
  // committed range — chỉ gọi API khi bấm "Áp dụng"
  const [committedFrom, setCommittedFrom] = useState(def.from);
  const [committedTo, setCommittedTo] = useState(def.to);

  const dateRangeInvalid = from > to;

  const { data, isLoading, isError, refetch } = useCourseTransactionItems(
    open && course ? course.courseId : null,
    committedFrom,
    committedTo,
  );

  function handleApply() {
    if (dateRangeInvalid) return;
    setCommittedFrom(from);
    setCommittedTo(to);
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-lg">
        <div className="h-1 shrink-0 bg-linear-to-r from-primary/80 via-amber-400/80 to-primary/20" />

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="p-6">
            <SheetHeader className="mb-5 space-y-0 text-left">
              <SheetTitle className="line-clamp-2 text-base leading-snug">
                {course?.courseName ?? "Chi tiết giao dịch"}
              </SheetTitle>
              <SheetDescription className="mt-1 text-xs text-muted-foreground">
                Lịch sử người dùng đăng ký khoá học
              </SheetDescription>
            </SheetHeader>

            {/* Date range filter */}
            <div className="mb-5 rounded-xl border border-border/60 bg-muted/20 p-4">
              <p className="mb-3 text-xs font-semibold text-muted-foreground">
                Khoảng thời gian
              </p>
              <div className="flex flex-wrap items-end gap-2">
                <div className="flex-1" style={{ minWidth: 120 }}>
                  <p className="mb-1 text-[11px] text-muted-foreground">Từ ngày</p>
                  <Input
                    type="date"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="flex-1" style={{ minWidth: 120 }}>
                  <p className="mb-1 text-[11px] text-muted-foreground">Đến ngày</p>
                  <Input
                    type="date"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <Button
                  size="sm"
                  className="h-8 text-xs"
                  disabled={dateRangeInvalid}
                  onClick={handleApply}
                >
                  Áp dụng
                </Button>
              </div>
              {dateRangeInvalid && (
                <p className="mt-1.5 text-[11px] text-destructive">
                  Ngày bắt đầu phải trước ngày kết thúc
                </p>
              )}
            </div>

            {/* Summary */}
            {data && (
              <div className="mb-4 flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background px-3 py-1 text-xs font-semibold">
                  {data.totalItems} giao dịch
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
                  {formatVND(data.totalRevenue)}
                </span>
              </div>
            )}

            {/* Content */}
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full rounded-lg" />
                ))}
              </div>
            ) : isError ? (
              <div className="flex flex-col items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center">
                <AlertCircle className="h-8 w-8 text-destructive/60" />
                <p className="text-sm text-muted-foreground">Không thể tải dữ liệu</p>
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  <RefreshCw className="mr-2 h-3.5 w-3.5" />
                  Thử lại
                </Button>
              </div>
            ) : !data || data.items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-center">
                <User className="h-8 w-8 text-muted-foreground/30" />
                <p className="text-sm font-medium text-muted-foreground">
                  Chưa có giao dịch nào
                </p>
                <p className="text-xs text-muted-foreground/70">
                  Trong khoảng {committedFrom} – {committedTo}
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-border/60">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/40 bg-muted/30">
                      <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">
                        #
                      </th>
                      <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">
                        Ngày thanh toán
                      </th>
                      <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">
                        Người mua
                      </th>
                      <th className="px-3 py-2.5 text-right text-xs font-medium text-muted-foreground">
                        Giá
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((item, idx) => (
                      <tr
                        key={item.transactionItemId}
                        className="border-b border-border/40 last:border-0 hover:bg-muted/20"
                      >
                        <td className="px-3 py-2.5 text-xs text-muted-foreground">
                          {idx + 1}
                        </td>
                        <td className="px-3 py-2.5 text-xs">
                          {item.paidAt ? formatDateTime(item.paidAt) : "—"}
                        </td>
                        <td className="px-3 py-2.5 text-xs text-muted-foreground">
                          Người mua
                        </td>
                        <td className="px-3 py-2.5 text-right text-xs font-medium tabular-nums">
                          {formatVND(item.price)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="shrink-0 border-t border-border/60 bg-background p-4">
          <Button variant="outline" className="w-full" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
