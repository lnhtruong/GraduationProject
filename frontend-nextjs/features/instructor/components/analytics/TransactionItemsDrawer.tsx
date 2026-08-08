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
import { useCourseTransactionItems } from "../../revenue/hooks";

export interface TransactionItemsDrawerCourse {
  courseId: number;
  courseName: string;
}

interface Props {
  course: TransactionItemsDrawerCourse | null;
  from?: string;
  to?: string;
  onClose: () => void;
}

function formatVND(amount: number): string {
  return `${Math.round(amount).toLocaleString("vi-VN")} ₫`;
}

function formatDateTime(value: string): { date: string; time: string } {
  const parts = value.split(" ");
  return { date: parts[0] ?? value, time: parts[1] ?? "" };
}

function RowSkeleton() {
  return (
    <div className="border-b border-border/40 px-5 py-3 sm:grid sm:grid-cols-[minmax(150px,1fr)_120px_minmax(170px,190px)] sm:items-center sm:gap-4">
      <div className="space-y-1.5">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="mt-2 h-3.5 w-20 sm:mt-0" />
      <div className="mt-2 space-y-1.5 sm:ml-auto sm:mt-0">
        <Skeleton className="h-4 w-24 sm:ml-auto" />
        <Skeleton className="h-3 w-36" />
      </div>
    </div>
  );
}

export function TransactionItemsDrawer({ course, from, to, onClose }: Props) {
  const open = course !== null;

  const { data, isLoading, isError, refetch } = useCourseTransactionItems(
    course?.courseId ?? null,
    from,
    to,
  );

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-xl lg:max-w-2xl"
      >
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

        {!isLoading && data && (
          <div className="grid grid-cols-2 gap-px border-b border-border/40 bg-border/20 xl:grid-cols-4">
            <div className="bg-background px-5 py-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Tạm thực nhận
              </p>
              <p className="mt-0.5 text-base font-bold tabular-nums text-primary">
                {formatVND(data.netRevenue ?? data.totalRevenue)}
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
                Doanh thu
              </p>
              <p className="mt-0.5 text-base font-bold tabular-nums">
                {formatVND(data.totalRevenue)}
              </p>
            </div>
            <div className="bg-background px-5 py-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Phí / thuế tạm
              </p>
              <p className="mt-0.5 text-base font-bold tabular-nums">
                {formatVND((data.platformFeeAmount ?? 0) + (data.taxAmount ?? 0))}
              </p>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <>
              {Array.from({ length: 6 }).map((_, i) => (
                <RowSkeleton key={i} />
              ))}
            </>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <AlertTriangle className="h-8 w-8 text-destructive/60" />
              <p className="text-sm text-muted-foreground">
                Không thể tải dữ liệu giao dịch
              </p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="mr-2 h-3.5 w-3.5" />
                Thử lại
              </Button>
            </div>
          ) : !data || data.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <Receipt className="h-8 w-8 text-muted-foreground/25" />
              <p className="text-sm font-medium text-muted-foreground">
                Chưa có giao dịch
              </p>
              <p className="text-xs text-muted-foreground/60">
                Không có lượt mua nào trong khoảng thời gian này
              </p>
            </div>
          ) : (
            <div>
              <div className="sticky top-0 z-10 hidden grid-cols-[minmax(150px,1fr)_120px_minmax(170px,190px)] items-center gap-4 border-b border-border/60 bg-muted/40 px-5 py-2.5 sm:grid">
                <span className="text-[11px] font-semibold text-muted-foreground">
                  Thời gian
                </span>
                <span className="text-[11px] font-semibold text-muted-foreground">
                  Người mua
                </span>
                <span className="text-right text-[11px] font-semibold text-muted-foreground">
                  Tạm thực nhận
                </span>
              </div>

              {data.items.map((item) => {
                const { date, time } = formatDateTime(item.paidAt ?? "");
                return (
                  <div
                    key={item.transactionItemId}
                    className="border-b border-border/30 px-5 py-3.5 transition-colors hover:bg-muted/20 last:border-0 sm:grid sm:grid-cols-[minmax(150px,1fr)_120px_minmax(170px,190px)] sm:items-start sm:gap-4"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold tabular-nums text-foreground">
                        {date}
                        {time && (
                          <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                            {time}
                          </span>
                        )}
                      </p>
                      {item.providerOrderId ? (
                        <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground/70">
                          <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                          <span className="truncate font-mono">
                            {item.providerOrderId}
                          </span>
                        </p>
                      ) : (
                        <p className="mt-1 text-[11px] text-muted-foreground/40">
                          Đã thanh toán
                        </p>
                      )}
                    </div>

                    <span className="mt-2 block text-xs text-muted-foreground sm:mt-0 sm:pt-0.5">
                      Người mua
                    </span>

                    <div className="mt-2 min-w-0 sm:mt-0 sm:text-right">
                      <p className="text-sm font-semibold tabular-nums text-primary">
                        {formatVND(item.netAmount ?? item.price)}
                      </p>
                      <p className="mt-1 text-[10px] leading-4 text-muted-foreground/65">
                        Doanh thu {formatVND(item.price)} · Phí {formatVND(item.platformFeeAmount ?? 0)}
                        <br />
                        GTGT {formatVND(item.vatAmount ?? 0)} · TNCN {formatVND(item.pitAmount ?? 0)}
                      </p>
                    </div>
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