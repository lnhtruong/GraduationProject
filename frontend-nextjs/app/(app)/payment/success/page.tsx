import { Suspense } from "react";
import PaymentSuccessPage from "@/features/payment/PaymentSuccessPage";

export default function Page() {
  return (
    <Suspense>
      <PaymentSuccessPage />
    </Suspense>
  );
}
