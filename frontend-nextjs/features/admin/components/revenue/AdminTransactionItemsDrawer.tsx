"use client";

import { Receipt, AlertTriangle, RefreshCw, ExternalLink } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminCourseTransactionItems } from "../../revenue/hooks";

export interface AdminTransactionDrawerCourse {
  courseId: number;
  courseName: string;
}

interface Props {
  userId: number;
  course: AdminTransactionDrawerCourse | null;
  from?: string;
  to?: string;
  onClose: () => void;
}

function formatVND(amount: number): string {
  return amount.toLocaleString("vi-VN") + " ₫";
}

function formatDateTime(value: string): { date: string; time: string } {
  const parts = value.split(" ");
  return { date: parts[0] ?? value, time: parts[1] ?? "" };
}

function RowSkeleton() {
  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 border-b border-border/40 px-5 py-3">
      <div className="space-y-1.5">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-3 w-32" />
      </div>
      <Skeleton className="h-3.5 w-12" />
      <Skeleton className="h-3.5 w-20" />
      <Skeleton className="h-3.5 w-20" />
    </div>
  );
}

export function AdminTransactionItemsDrawer({ userId, course, from, to, onClose }: Props) {
  const open = course !== null;

  const { data, isLoading, isError, refetch } = useAdminCourseTransactionItems(
    userId,
    course?.courseId ?? null,
    course?.courseName ?? "",
    from,
    to,
  );

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-xl"
      >
        {/* Header */}
        <SheetHeader className="border-b border-border/60 px-5 py-4 pr-12">
          <div>
            <SheetTitle className="flex items-center gap-2 text-base">
              <Receipt className="h-4 w-4 shrink-0 text-primary" />
              Chi tiết giao dịch
            </SheetTitle>
            {course && (
              <p className="mt-0.5 truncate text-sm text-muted-foreground">
                {course.courseName}
              </p>
            )}
            <p className="mt-0.5 text-[11px] text-muted-foreground/60">
              User ID: <span className="font-medium text-foreground">#{userId}</span>
            </p>
          </div>

          {(from || to) && (
            <p className="mt-2 text-[11px] text-muted-foreground">
              Khoảng thời gian:{" "}
              <span className="font-medium text-foreground">
                {from ?? "—"} → {to ?? "—"}
              </span>
            </p>
          )}
        </SheetHeader>

        {/* Summary strip */}
        {!isLoading && data && (
          <div className="grid grid-cols-3 gap-px border-b border-border/40 bg-border/20">
            <div className="bg-background px-5 py-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Doanh thu
              </p>
              <p className="mt-0.5 text-base font-bold tabular-nums text-primary">
                {formatVND(data.totalRevenue)}
              </p>
            </div>
            <div className="bg-background px-5 py-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Lượt mua
              </p>
              <p className="mt-0.5 text-base font-bold tabular-nums">
                {data.totalItems}
              </p>
            </div>
            <div className="bg-background px-5 py-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Trung bình
              </p>
              <p className="mt-0.5 text-base font-bold tabular-nums">
                {data.totalItems > 0
                  ? formatVND(Math.round(data.totalRevenue / data.totalItems))
                  : "—"}
              </p>
            </div>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <>{Array.from({ length: 6 }).map((_, i) => <RowSkeleton key={i} />)}</>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <AlertTriangle className="h-8 w-8 text-destructive/60" />
              <p className="text-sm text-muted-foreground">Không thể tải dữ liệu giao dịch</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="mr-2 h-3.5 w-3.5" />
                Thử lại
              </Button>
            </div>
          ) : !data || data.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <Receipt className="h-8 w-8 text-muted-foreground/25" />
              <p className="text-sm font-medium text-muted-foreground">Chưa có giao dịch</p>
              <p className="text-xs text-muted-foreground/60">
                Không có lượt mua nào trong khoảng thời gian này
              </p>
            </div>
          ) : (
            <div>
              {/* Table header */}
              <div className="sticky top-0 grid grid-cols-[1fr_auto_auto_auto] gap-3 border-b border-border/60 bg-muted/40 px-5 py-2">
                <span className="text-[11px] font-medium text-muted-foreground">Thời gian / Mã GD</span>
                <span className="text-[11px] font-medium text-muted-foreground">Buyer</span>
                <span className="text-right text-[11px] font-medium text-muted-foreground">Tổng đơn</span>
                <span className="text-right text-[11px] font-medium text-muted-foreground">Khoá này</span>
              </div>

              {/* Rows */}
              {data.items.map((item) => {
                const { date, time } = formatDateTime(item.paidAt ?? "");
                return (
                  <div
                    key={item.transactionItemId}
                    className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 border-b border-border/30 px-5 py-3 transition-colors hover:bg-muted/20 last:border-0"
                  >
                    {/* Date + order code */}
                    <div className="min-w-0">
                      <p className="text-sm font-medium tabular-nums">
                        {date}
                        {time && (
                          <span className="ml-1.5 text-xs text-muted-foreground">{time}</span>
                        )}
                      </p>
                      {item.providerOrderId ? (
                        <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground/70">
                          <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                          <span className="truncate font-mono">{item.providerOrderId}</span>
                        </p>
                      ) : (
                        <p className="mt-0.5 text-[11px] text-muted-foreground/40">
                          #{item.transactionId}
                        </p>
                      )}
                    </div>

                    {/* Buyer */}
                    <span className="text-xs text-muted-foreground tabular-nums">
                      #{item.buyerUserId}
                    </span>

                    {/* Total order amount */}
                    <span className="text-right text-xs tabular-nums text-muted-foreground">
                      {formatVND(item.transactionTotalAmount)}
                    </span>

                    {/* Course price (instructor's share) */}
                    <span className="text-right text-sm font-semibold tabular-nums text-primary">
                      {formatVND(item.price)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
