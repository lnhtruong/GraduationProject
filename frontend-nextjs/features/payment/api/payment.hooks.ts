"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { paymentApi } from "./payment.api";
import type { BuyNowResponse, PaymentLinkResponse } from "./payment.api";

// Redirect thẳng đến PayOS checkout URL
function redirectToPayOS(checkoutUrl: string) {
  window.location.href = checkoutUrl;
}

function normalizeCourseId(courseId: number | null | undefined) {
  return typeof courseId === "number" && Number.isInteger(courseId) && courseId > 0 ? courseId : null;
}

export function useBuyNow(courseId: number | null | undefined) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation<BuyNowResponse, Error>({
    mutationFn: async () => {
      const resolvedCourseId = normalizeCourseId(courseId);
      if (!resolvedCourseId) {
        throw new Error("Mã khóa học không hợp lệ");
      }

      const data = await paymentApi.buyNow(resolvedCourseId);
      if (!data.enrolled && !data.checkoutUrl) {
        throw new Error("Không nhận được link thanh toán");
      }

      return data;
    },
    onSuccess: (data) => {
      const resolvedCourseId = normalizeCourseId(courseId);
      if (!resolvedCourseId) {
        toast.error("Không xác định được khóa học.");
        return;
      }

      if (data.enrolled) {
        queryClient.invalidateQueries({ queryKey: ["enrollment"] });
        queryClient.invalidateQueries({ queryKey: ["cart"] });
        router.push(`/payment/success?free=1&courseId=${resolvedCourseId}`);
        return;
      }
      if (!data.checkoutUrl) {
        toast.error("Không nhận được link thanh toán.");
        return;
      }
      sessionStorage.setItem(`payment_course_${data.orderCode}`, String(resolvedCourseId));
      if (data.orderCode) {
        sessionStorage.setItem(
          `payment_courses_${data.orderCode}`,
          JSON.stringify([resolvedCourseId]),
        );
      }
      redirectToPayOS(data.checkoutUrl);
    },
  });
}

export function useCreatePayment() {
  return useMutation<PaymentLinkResponse, Error, number[]>({
    mutationFn: async (courseIds) => {
      const data = await paymentApi.createPayment(courseIds);
      if (!data.checkoutUrl) {
        throw new Error("Không nhận được link thanh toán");
      }
      return data;
    },
    onSuccess: (data, courseIds) => {
      if (!data.checkoutUrl) {
        toast.error("Không nhận được link thanh toán.");
        return;
      }
      if (data.orderCode) {
        sessionStorage.setItem(
          `payment_courses_${data.orderCode}`,
          JSON.stringify(courseIds),
        );
      }
      redirectToPayOS(data.checkoutUrl);
    },
    onError: () => {
      toast.error("Không thể tạo đơn thanh toán. Vui lòng thử lại.");
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
