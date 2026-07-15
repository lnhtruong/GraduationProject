import { buildPrivatePageMetadata } from "@/lib/metadata";

export const metadata = buildPrivatePageMetadata(
  "Thanh toán thành công",
  "Xác nhận giao dịch khóa học đã được hoàn tất trên StudyLoop.",
);

import { Suspense } from "react";
import PaymentSuccessPage from "@/features/payment/PaymentSuccessPage";

export default function Page() {
  return (
    <Suspense>
      <PaymentSuccessPage />
    </Suspense>
  );
}
