"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AlertCircle, ArrowLeft, Home, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOrderStatus } from "@/features/payment/api/payment.hooks";

function PaymentCancelContent() {
  const searchParams = useSearchParams();
  const orderCode = searchParams.get("orderCode");
  const courseId = searchParams.get("courseId");
  const retryHref = courseId ? `/courses/${courseId}` : "/cart";

  useOrderStatus(orderCode);

  if (!orderCode) {
    return (
      <section className="flex min-h-[calc(100svh-5rem)] items-center bg-background px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl space-y-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground shadow-sm">
            <AlertCircle className="h-7 w-7" />
          </div>
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Liên kết không hợp lệ
            </p>
            <h1 className="text-3xl font-bold tracking-normal text-foreground sm:text-4xl">
              Không tìm thấy giao dịch
            </h1>
            <p className="text-base leading-7 text-muted-foreground sm:text-lg">
              Trang này chỉ hiển thị sau khi bạn hủy thanh toán từ PayOS với mã đơn hàng hợp lệ.
            </p>
          </div>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" variant="outline">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Trang chủ
              </Link>
            </Button>
            <Button asChild size="lg">
              <Link href="/cart">
                Quay lại giỏ hàng
              </Link>
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="flex min-h-[calc(100svh-5rem)] items-center bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-5xl items-center gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-7 text-center lg:text-left">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-orange-500 text-white shadow-sm lg:mx-0">
            <X className="h-7 w-7" strokeWidth={2.4} />
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-wide text-amber-600">
              Giao dịch đã dừng
            </p>
            <h1 className="text-3xl font-bold tracking-normal text-foreground sm:text-4xl">
              Thanh toán đã hủy
            </h1>
            <p className="mx-auto max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg lg:mx-0">
              Bạn chưa bị ghi nhận thanh toán. Khóa học vẫn được giữ nguyên để
              bạn quay lại kiểm tra giỏ hàng hoặc thử thanh toán lại khi sẵn sàng.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:mx-auto sm:max-w-md sm:flex-row lg:mx-0">
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Trang chủ
              </Link>
            </Button>
            <Button asChild size="lg" className="w-full bg-orange-500 hover:bg-orange-600 sm:w-auto">
              <Link href={retryHref}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {courseId ? "Quay lại khóa học" : "Quay lại giỏ hàng"}
              </Link>
            </Button>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <span className="h-10 w-1 rounded-full bg-orange-500" aria-hidden="true" />
            <div>
              <h2 className="text-base font-semibold">Thông tin giao dịch</h2>
              <p className="text-sm text-muted-foreground">Trạng thái từ PayOS</p>
            </div>
          </div>

          <dl className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-4 rounded-md bg-muted/50 px-3 py-2">
              <dt className="text-muted-foreground">Trạng thái</dt>
              <dd className="font-medium text-amber-600">Đã hủy</dd>
            </div>
            {orderCode ? (
              <div className="flex items-center justify-between gap-4 rounded-md bg-muted/50 px-3 py-2">
                <dt className="text-muted-foreground">Mã đơn hàng</dt>
                <dd className="break-all text-right font-mono font-medium">#{orderCode}</dd>
              </div>
            ) : null}
            <div className="flex items-center justify-between gap-4 rounded-md bg-muted/50 px-3 py-2">
              <dt className="text-muted-foreground">Thanh toán</dt>
              <dd className="font-medium">Chưa hoàn tất</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}

export default function PaymentCancelClient() {
  return (
    <Suspense>
      <PaymentCancelContent />
    </Suspense>
  );
}
