import { buildPrivatePageMetadata } from "@/lib/metadata";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export const metadata = buildPrivatePageMetadata(
  "Thanh toán thành công",
  "Xác nhận giao dịch khóa học đã được hoàn tất trên StudyLoop.",
);

import { Suspense } from "react";
import PaymentSuccessPage from "@/features/payment/PaymentSuccessPage";

export default function Page() {
  return (
    <Suspense>
      <ProtectedRoute>
        <PaymentSuccessPage />
      </ProtectedRoute>
    </Suspense>
  );
}
