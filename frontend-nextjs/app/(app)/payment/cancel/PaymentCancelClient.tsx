"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

function PaymentCancelContent() {
  const searchParams = useSearchParams();
  const orderCode = searchParams.get("orderCode");
  const courseId = searchParams.get("courseId");

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-yellow-500/10">
        <AlertTriangle className="h-10 w-10 text-yellow-500" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Thanh toán đã huỷ</h1>
        <p className="text-muted-foreground">
          Bạn đã huỷ giao dịch{orderCode ? ` #${orderCode}` : ""}.
          <br />
          Khoá học vẫn còn trong giỏ hàng của bạn.
        </p>
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
            <Link href="/cart">
              <RotateCcw className="mr-2 h-4 w-4" />
              Quay lại giỏ hàng
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense>
      <PaymentCancelContent />
    </Suspense>
  );
}
