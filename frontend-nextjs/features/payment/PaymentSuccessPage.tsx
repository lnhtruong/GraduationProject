"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, BookOpen, Check, Home, Loader2, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOrderStatus } from "./api/payment.hooks";

function readStoredCourseIds(orderCode: string | null, courseIdFromUrl: string | null) {
  if (courseIdFromUrl) {
    const parsed = Number(courseIdFromUrl);
    return Number.isInteger(parsed) && parsed > 0 ? [parsed] : [];
  }

  if (!orderCode || typeof window === "undefined") {
    return [];
  }

  const multiRaw = sessionStorage.getItem(`payment_courses_${orderCode}`);
  if (multiRaw) {
    try {
      const parsed = JSON.parse(multiRaw) as unknown;
      if (Array.isArray(parsed)) {
        return parsed
          .map((value) => Number(value))
          .filter((value) => Number.isInteger(value) && value > 0);
      }
    } catch {
      // Fall back to the legacy single-course key below.
    }
  }

  const singleRaw = sessionStorage.getItem(`payment_course_${orderCode}`);
  const single = Number(singleRaw);
  return Number.isInteger(single) && single > 0 ? [single] : [];
}

function OrderSummary({
  orderCode,
  formattedTime,
  statusLabel,
  statusTone,
}: {
  orderCode: string | null;
  formattedTime: string;
  statusLabel: string;
  statusTone: "success" | "warning" | "danger";
}) {
  const statusClass =
    statusTone === "success"
      ? "text-emerald-600"
      : statusTone === "warning"
        ? "text-amber-600"
        : "text-destructive";
  const accentClass =
    statusTone === "success"
      ? "bg-emerald-500"
      : statusTone === "warning"
        ? "bg-amber-500"
        : "bg-destructive";

  return (
    <div className="rounded-lg border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <span className={`h-10 w-1 rounded-full ${accentClass}`} aria-hidden="true" />
        <div>
          <h2 className="text-base font-semibold">Chi tiết đơn hàng</h2>
          <p className="text-sm text-muted-foreground">Trạng thái từ PayOS</p>
        </div>
      </div>

      <dl className="space-y-3 text-sm">
        <div className="flex items-center justify-between gap-4 rounded-md bg-muted/50 px-3 py-2">
          <dt className="text-muted-foreground">Trạng thái</dt>
          <dd className={`font-medium ${statusClass}`}>{statusLabel}</dd>
        </div>
        {orderCode ? (
          <div className="flex items-center justify-between gap-4 rounded-md bg-muted/50 px-3 py-2">
            <dt className="text-muted-foreground">Mã đơn hàng</dt>
            <dd className="break-all text-right font-mono font-medium">#{orderCode}</dd>
          </div>
        ) : null}
        <div className="flex items-center justify-between gap-4 rounded-md bg-muted/50 px-3 py-2">
          <dt className="text-muted-foreground">Thời gian</dt>
          <dd className="text-right font-medium">{formattedTime}</dd>
        </div>
      </dl>
    </div>
  );
}

function InvalidPaymentState() {
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
            Trang này chỉ hiển thị sau khi bạn quay về từ PayOS với mã đơn hàng hợp lệ.
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
            <Link href="/my-courses">
              <BookOpen className="mr-2 h-4 w-4" />
              Khóa học của tôi
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const orderCode = searchParams.get("orderCode");
  const isFree = searchParams.get("free") === "1";
  const courseIdFromUrl = searchParams.get("courseId");

  const [courseIds] = useState<number[]>(() =>
    readStoredCourseIds(orderCode, courseIdFromUrl),
  );
  const [showTimeout, setShowTimeout] = useState(false);
  const courseId = courseIds.length === 1 ? String(courseIds[0]) : null;

  const { data: orderStatus, isLoading } = useOrderStatus(isFree ? null : orderCode);
  const status = isFree ? "PAID" : orderStatus?.status;
  const hasValidEntryParams = isFree ? !!courseIdFromUrl : !!orderCode;

  useEffect(() => {
    if (isFree || status === "PAID" || status === "FAILED" || status === "CANCELLED") return;
    const timer = window.setTimeout(() => setShowTimeout(true), 10_000);
    return () => window.clearTimeout(timer);
  }, [isFree, status]);

  useEffect(() => {
    if (status === "PAID") {
      queryClient.invalidateQueries({ queryKey: ["enrollment"] });
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      if (orderCode) {
        sessionStorage.removeItem(`payment_course_${orderCode}`);
        sessionStorage.removeItem(`payment_courses_${orderCode}`);
      }
    }
  }, [status, courseIds, orderCode, queryClient]);

  const formattedTime = new Date().toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  if (!hasValidEntryParams || (!isFree && !isLoading && !status)) {
    return <InvalidPaymentState />;
  }

  if (!isFree && (isLoading || status === "PENDING")) {
    return (
      <section className="flex min-h-[calc(100svh-5rem)] items-center bg-background px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-5xl items-center gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-7 text-center lg:text-left">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm lg:mx-0">
              <Loader2 className="h-7 w-7 animate-spin" />
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-wide text-primary">
                Đang xác nhận
              </p>
              <h1 className="text-3xl font-bold tracking-normal text-foreground sm:text-4xl">
                Đang kiểm tra thanh toán
              </h1>
              <p className="mx-auto max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg lg:mx-0">
                Trang sẽ tự cập nhật khi PayOS hoặc ngân hàng xác nhận giao dịch.
                Bạn có thể giữ nguyên trang này trong lúc hệ thống xử lý.
              </p>
            </div>

            {showTimeout ? (
              <div className="mx-auto flex max-w-xl items-start gap-3 rounded-lg border bg-card px-4 py-3 text-left lg:mx-0">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <p className="text-sm text-muted-foreground">
                  Nếu trạng thái chưa đổi sau vài phút, hãy kiểm tra lại trong trang khóa học của tôi.
                </p>
              </div>
            ) : null}
          </div>

          <OrderSummary
            orderCode={orderCode}
            formattedTime={formattedTime}
            statusLabel="Đang xác nhận"
            statusTone="warning"
          />
        </div>
      </section>
    );
  }

  if (status === "FAILED" || status === "CANCELLED") {
    const retryHref = courseId ? `/courses/${courseId}` : "/courses/search";

    return (
      <section className="flex min-h-[calc(100svh-5rem)] items-center bg-background px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-5xl items-center gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-7 text-center lg:text-left">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm lg:mx-0">
              <X className="h-7 w-7" strokeWidth={2.4} />
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-wide text-destructive">
                Giao dịch chưa hoàn tất
              </p>
              <h1 className="text-3xl font-bold tracking-normal text-foreground sm:text-4xl">
                {status === "CANCELLED" ? "Thanh toán đã hủy" : "Thanh toán không thành công"}
              </h1>
              <p className="mx-auto max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg lg:mx-0">
                {status === "CANCELLED"
                  ? "Bạn đã hủy giao dịch này. Khóa học vẫn chưa được ghi nhận thanh toán."
                  : "Giao dịch thất bại. Bạn có thể thử lại hoặc chọn phương thức thanh toán khác."}
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:mx-auto sm:max-w-md sm:flex-row lg:mx-0">
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  Trang chủ
                </Link>
              </Button>
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href={retryHref}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Thử lại
                </Link>
              </Button>
            </div>
          </div>

          <OrderSummary
            orderCode={orderCode}
            formattedTime={formattedTime}
            statusLabel={status === "CANCELLED" ? "Đã hủy" : "Thất bại"}
            statusTone="danger"
          />
        </div>
      </section>
    );
  }

  return (
    <section className="flex min-h-[calc(100svh-5rem)] items-center bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-5xl items-center gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-7 text-center lg:text-left">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm lg:mx-0">
            <Check className="h-7 w-7" strokeWidth={2.4} />
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">
              Giao dịch hoàn tất
            </p>
            <h1 className="text-3xl font-bold tracking-normal text-foreground sm:text-4xl">
              {isFree ? "Đăng ký thành công" : "Thanh toán thành công"}
            </h1>
            <p className="mx-auto max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg lg:mx-0">
              {isFree
                ? "Khóa học đã được thêm vào tài khoản của bạn. Bạn có thể bắt đầu học ngay."
                : "Khóa học đã được ghi nhận vào tài khoản. Chúc bạn học tốt."}
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:mx-auto sm:max-w-md sm:flex-row lg:mx-0">
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Trang chủ
              </Link>
            </Button>
            {courseId ? (
              <Button asChild size="lg" className="w-full bg-emerald-600 hover:bg-emerald-700 sm:w-auto">
                <Link href={`/courses/${courseId}/learn`}>
                  <BookOpen className="mr-2 h-4 w-4" />
                  Bắt đầu học
                </Link>
              </Button>
            ) : (
              <Button asChild size="lg" className="w-full bg-emerald-600 hover:bg-emerald-700 sm:w-auto">
                <Link href="/my-courses">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Khóa học của tôi
                </Link>
              </Button>
            )}
          </div>
        </div>

        <OrderSummary
          orderCode={orderCode}
          formattedTime={formattedTime}
          statusLabel={isFree ? "Miễn phí" : "Đã thanh toán"}
          statusTone="success"
        />
      </div>
    </section>
  );
}
