"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

function PaymentCancelContent() {
  const searchParams = useSearchParams();
  const orderCode = searchParams.get("orderCode");

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <XCircle className="h-10 w-10 text-muted-foreground" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Thanh toán đã huỷ</h1>
        <p className="text-muted-foreground">
          Bạn đã huỷ giao dịch{orderCode ? ` #${orderCode}` : ""}. Khoá học vẫn còn trong giỏ hàng của bạn.
        </p>
      </div>
      <div className="flex gap-3">
        <Button asChild variant="outline">
          <Link href="/courses">Xem khoá học</Link>
        </Button>
        <Button asChild>
          <Link href="/cart">Quay lại giỏ hàng</Link>
        </Button>
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
