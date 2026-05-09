"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { paymentApi } from "./payment.api";
import type { BuyNowResponse, PaymentLinkResponse } from "./payment.api";

// Redirect thẳng đến PayOS checkout URL
function redirectToPayOS(checkoutUrl: string) {
  window.location.href = checkoutUrl;
}

export function useBuyNow(courseId: number) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation<BuyNowResponse, Error>({
    mutationFn: () => paymentApi.buyNow(courseId),
    onSuccess: (data) => {
      if (data.enrolled) {
        // Khoá học miễn phí — backend đã enroll, chỉ cần refresh enrollment
        queryClient.invalidateQueries({ queryKey: ["enrollment", "check", courseId] });
        router.push(`/payment/success?free=1&courseId=${courseId}`);
        return;
      }
      // Khoá học trả phí — redirect đến PayOS
      redirectToPayOS(data.checkoutUrl);
    },
  });
}

export function useCreatePayment() {
  const router = useRouter();

  return useMutation<PaymentLinkResponse, Error, number[]>({
    mutationFn: (courseIds) => paymentApi.createPayment(courseIds),
    onSuccess: (data) => {
      redirectToPayOS(data.checkoutUrl);
    },
    onError: (error) => {
      console.error("Tạo thanh toán thất bại:", error);
    },
  });
}

// Poll trạng thái đơn hàng sau khi return từ PayOS
export function useOrderStatus(orderCode: string | null) {
  return useQuery({
    queryKey: ["payment", "order-status", orderCode],
    queryFn: () => paymentApi.getOrderStatus(orderCode!),
    enabled: !!orderCode,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      // Dừng poll khi có kết quả cuối
      if (status === "PAID" || status === "FAILED" || status === "CANCELLED") return false;
      return 2000; // poll mỗi 2 giây
    },
    retry: false,
    staleTime: 0,
  });
}
