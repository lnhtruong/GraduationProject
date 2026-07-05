import { buildPrivatePageMetadata } from "@/lib/metadata";
import PaymentCancelClient from "./PaymentCancelClient";

export const metadata = buildPrivatePageMetadata(
  "Thanh toán đã hủy",
  "Giao dịch khóa học đã được hủy và bạn có thể quay lại giỏ hàng để thử lại.",
);

export default function Page() {
  return <PaymentCancelClient />;
}
