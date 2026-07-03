"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, Loader2, AlertCircle, ShoppingBag, Home, BookOpen, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useOrderStatus } from "./api/payment.hooks";
import { useQueryClient } from "@tanstack/react-query";

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const orderCode = searchParams.get("orderCode");
  const isFree = searchParams.get("free") === "1";
  const courseIdFromUrl = searchParams.get("courseId");

  const [courseId, setCourseId] = useState<string | null>(courseIdFromUrl);
  const [showTimeout, setShowTimeout] = useState(false);

  useEffect(() => {
    if (!courseIdFromUrl && orderCode) {
      const stored = sessionStorage.getItem(`payment_course_${orderCode}`);
      if (stored) setCourseId(stored);
    }
  }, [orderCode, courseIdFromUrl]);

  const { data: orderStatus, isLoading } = useOrderStatus(isFree ? null : orderCode);
  const status = isFree ? "PAID" : orderStatus?.status;

  // Hiện timeout message sau 10 giây nếu vẫn PENDING
  useEffect(() => {
    if (isFree || status === "PAID" || status === "FAILED" || status === "CANCELLED") return;
    const timer = setTimeout(() => setShowTimeout(true), 10_000);
    return () => clearTimeout(timer);
  }, [isFree, status]);

  useEffect(() => {
    if (status === "PAID") {
      if (courseId) {
        queryClient.invalidateQueries({ queryKey: ["enrollment", "check", Number(courseId)] });
      }
      queryClient.invalidateQueries({ queryKey: ["enrollment"] });
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      if (orderCode) sessionStorage.removeItem(`payment_course_${orderCode}`);
    }
  }, [status, courseId, orderCode, queryClient]);

  // ── Loading / Pending ────────────────────────────────────────────────────
  if (!isFree && (isLoading || status === "PENDING")) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-5 px-4 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <Loader2 className="h-9 w-9 animate-spin text-primary" />
        </div>
        <div className="space-y-1.5">
          <h1 className="text-xl font-bold">Đang xác nhận thanh toán...</h1>
          <p className="text-sm text-muted-foreground">
            Trang sẽ tự cập nhật khi ngân hàng xác nhận giao dịch.
          </p>
        </div>
        {showTimeout && (
          <div className="flex max-w-sm items-start gap-2.5 rounded-lg border border-yellow-500/30 bg-yellow-500/8 px-4 py-3 text-left">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-600 dark:text-yellow-400" />
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              Nếu trang không tự cập nhật, hãy kiểm tra{" "}
              <Link href="/profile/orders" className="font-medium underline underline-offset-2">
                lịch sử đơn hàng
              </Link>{" "}
              của bạn.
            </p>
          </div>
        )}
      </div>
    );
  }

  // ── Failed / Cancelled ───────────────────────────────────────────────────
  if (status === "FAILED" || status === "CANCELLED") {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-4 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
          <XCircle className="h-10 w-10 text-destructive" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">
            {status === "CANCELLED" ? "Giao dịch đã huỷ" : "Thanh toán không thành công"}
          </h1>
          <p className="text-muted-foreground">
            {status === "CANCELLED"
              ? "Bạn đã huỷ giao dịch này."
              : "Giao dịch thất bại. Vui lòng thử lại hoặc chọn phương thức thanh toán khác."}
          </p>
          {orderCode && (
            <p className="text-xs text-muted-foreground">Mã đơn hàng: #{orderCode}</p>
          )}
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild variant="outline">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Trang chủ
            </Link>
          </Button>
          {courseId ? (
            <Button asChild>
              <Link href={`/courses/${courseId}`}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Thử lại
              </Link>
            </Button>
          ) : (
            <Button asChild>
              <Link href="/courses/search">
                <RotateCcw className="mr-2 h-4 w-4" />
                Xem khoá học khác
              </Link>
            </Button>
          )}
        </div>
      </div>
    );
  }

  // ── Success (PAID hoặc free) ─────────────────────────────────────────────
  const now = new Date();
  const formattedTime = now.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-4 py-12 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10">
        <CheckCircle className="h-10 w-10 text-green-500" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold">
          {isFree ? "Đăng ký thành công!" : "Thanh toán thành công!"}
        </h1>
        <p className="text-muted-foreground">
          {isFree
            ? "Khoá học đã được thêm vào thư viện của bạn."
            : "Cảm ơn bạn đã mua khoá học. Chúc bạn học tốt!"}
        </p>
      </div>

      {/* Order summary card */}
      <div className="w-full max-w-sm rounded-xl border border-border/60 bg-card text-left shadow-sm">
        <div className="flex items-center gap-2.5 border-b border-border/60 px-4 py-3">
          <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">Chi tiết đơn hàng</span>
        </div>
        <div className="space-y-0 px-4 py-3">
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground">Trạng thái</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-600 dark:text-green-400">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              {isFree ? "Miễn phí" : "Đã thanh toán"}
            </span>
          </div>
          {orderCode && (
            <>
              <Separator className="opacity-50" />
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground">Mã đơn hàng</span>
                <span className="font-mono text-sm font-medium">#{orderCode}</span>
              </div>
            </>
          )}
          <Separator className="opacity-50" />
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground">Thời gian</span>
            <span className="text-sm">{formattedTime}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <Button asChild variant="outline">
          <Link href="/">
            <Home className="mr-2 h-4 w-4" />
            Trang chủ
          </Link>
        </Button>
        {courseId ? (
          <Button asChild>
            <Link href={`/courses/${courseId}/learn`}>
              <BookOpen className="mr-2 h-4 w-4" />
              Bắt đầu học ngay
            </Link>
          </Button>
        ) : (
          <Button asChild>
            <Link href="/library">
              <BookOpen className="mr-2 h-4 w-4" />
              Vào thư viện
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
