import { createApi, apiHttpClient } from "@/features/_shared/api-factories";

export type OrderStatus = "PAID" | "PENDING" | "FAILED" | "CANCELLED";

export interface PaymentLinkResponse {
  orderCode: number;
  checkoutUrl: string | null;
  qrCode?: string;
  transaction_id: number;
}

export interface BuyNowResponse extends PaymentLinkResponse {
  enrolled?: boolean;
}

export interface OrderStatusResponse {
  orderCode: string;
  status: OrderStatus;
}

export const paymentApi = createApi({
  // Mua trực tiếp 1 khoá học (có thể free hoặc paid)
  buyNow: async (courseId: number): Promise<BuyNowResponse> => {
    const { data } = await apiHttpClient.post<BuyNowResponse>("/payment/buy-now", { courseId });
    return data;
  },

  // Tạo payment link cho nhiều khoá học trong cart
  createPayment: async (courseIds: number[]): Promise<PaymentLinkResponse> => {
    const { data } = await apiHttpClient.post<PaymentLinkResponse>("/payment/create-payment", { courseIds });
    return data;
  },

  // Kiểm tra trạng thái đơn hàng
  getOrderStatus: async (orderCode: string): Promise<OrderStatusResponse> => {
    const { data } = await apiHttpClient.get<OrderStatusResponse>(`/payment/order-status/${orderCode}`);
    return data;
  },
});
