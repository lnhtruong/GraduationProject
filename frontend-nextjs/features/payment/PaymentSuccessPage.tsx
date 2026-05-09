"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOrderStatus } from "./api/payment.hooks";
import { useQueryClient } from "@tanstack/react-query";

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const orderCode = searchParams.get("orderCode");
  const isFree = searchParams.get("free") === "1";
  const courseId = searchParams.get("courseId");

  const { data: orderStatus, isLoading } = useOrderStatus(
    isFree ? null : orderCode,
  );

  const status = isFree ? "PAID" : orderStatus?.status;

  useEffect(() => {
    if (status === "PAID") {
      // Khoá học đã thanh toán — invalidate enrollment để sidebar/detail refresh
      if (courseId) {
        queryClient.invalidateQueries({ queryKey: ["enrollment", "check", Number(courseId)] });
      }
      queryClient.invalidateQueries({ queryKey: ["enrollment"] });
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    }
  }, [status, courseId, queryClient]);

  // Chờ kết quả từ PayOS
  if (!isFree && isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Đang xác nhận thanh toán...</p>
      </div>
    );
  }

  // Thanh toán thất bại / bị huỷ
  if (status === "FAILED" || status === "CANCELLED") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
          <XCircle className="h-10 w-10 text-destructive" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Thanh toán không thành công</h1>
          <p className="text-muted-foreground">
            {status === "CANCELLED" ? "Bạn đã huỷ giao dịch." : "Giao dịch thất bại. Vui lòng thử lại."}
          </p>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="outline">
            <Link href="/cart">Quay lại giỏ hàng</Link>
          </Button>
          <Button asChild>
            <Link href="/courses">Xem khoá học</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Đang chờ PayOS xác nhận (PENDING)
  if (!isFree && status === "PENDING") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="font-medium">Đang chờ xác nhận thanh toán từ ngân hàng...</p>
        <p className="text-sm text-muted-foreground">Trang sẽ tự cập nhật khi thanh toán được xử lý.</p>
      </div>
    );
  }

  // Thành công (PAID hoặc free)
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10">
        <CheckCircle className="h-10 w-10 text-green-500" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">
          {isFree ? "Đăng ký thành công!" : "Thanh toán thành công!"}
        </h1>
        <p className="text-muted-foreground">
          {isFree
            ? "Bạn đã đăng ký khoá học miễn phí thành công."
            : "Khoá học đã được thêm vào thư viện của bạn."}
        </p>
      </div>
      <div className="flex gap-3">
        <Button asChild variant="outline">
          <Link href="/library">Thư viện của tôi</Link>
        </Button>
        {courseId && (
          <Button asChild>
            <Link href={`/courses/${courseId}/learn`}>Bắt đầu học ngay</Link>
          </Button>
        )}
        {!courseId && (
          <Button asChild>
            <Link href="/courses">Xem khoá học</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
