import { createApi, apiHttpClient } from "@/features/_shared/api-factories";
import type { CartItem, CartSummary, CouponResult } from "../types";

// Backend cart item response (GET /course/carts)
type CartItemApiResponse = {
  id: number;
  courseId: number;
  // Course info joined from Course Service
  title?: string;
  instructorName?: string;
  thumbnailUrl?: string;
  level?: "Beginner" | "Intermediate" | "Advanced";
  durationSeconds?: number;
  price?: number;
  originalPrice?: number;
  avgRating?: number;
  reviewCount?: number;
};

type CartApiResponse = {
  id: number;
  userId: number;
  totalQuantity: number;
  totalAmount: number;
  items: CartItemApiResponse[];
};

type AddToCartResponse = {
  id: number;
  cartId: number;
  courseId: number;
};

function mapCartItem(raw: CartItemApiResponse): CartItem {
  return {
    id: raw.id,
    courseId: raw.courseId,
    title: raw.title ?? "",
    instructorName: raw.instructorName ?? "",
    thumbnailUrl: raw.thumbnailUrl,
    level: raw.level ?? "Beginner",
    durationSeconds: raw.durationSeconds ?? 0,
    price: raw.price ?? 0,
    originalPrice: raw.originalPrice,
    avgRating: raw.avgRating,
    reviewCount: raw.reviewCount,
    savedForLater: false,
  };
}

export const cartApi = createApi({
  getCart: async (): Promise<CartItem[]> => {
    const { data } = await apiHttpClient.get<CartApiResponse>("/course/carts");
    return (data.items ?? []).map(mapCartItem);
  },

  getCartSummary: async (): Promise<Pick<CartSummary, "itemCount" | "subtotal">> => {
    const { data } = await apiHttpClient.get<CartApiResponse>("/course/carts");
    return {
      itemCount: data.totalQuantity ?? 0,
      subtotal: data.totalAmount ?? 0,
    };
  },

  addToCart: async (courseId: number): Promise<AddToCartResponse> => {
    const { data } = await apiHttpClient.post<AddToCartResponse>("/course/carts/items", { courseId });
    return data;
  },

  removeFromCart: async (courseId: number): Promise<void> => {
    await apiHttpClient.delete(`/course/carts/items/${courseId}`);
  },

  clearCart: async (): Promise<void> => {
    await apiHttpClient.delete("/course/carts");
  },

  // coupon chưa được backend hỗ trợ
  applyCoupon: async (code: string): Promise<CouponResult> => {
    void code;
    return { valid: false, message: "Tính năng coupon chưa khả dụng." };
  },

  // saved for later chưa được backend hỗ trợ
  saveForLater: async (courseId: number, saved: boolean): Promise<void> => {
    void courseId;
    void saved;
  },
});
