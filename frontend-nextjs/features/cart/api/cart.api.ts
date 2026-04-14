/**
 * Cart API
 *
 * [MOCK] Tất cả functions hiện tại return mock data / no-op.
 * Để swap sang real API:
 * 1. Uncomment phần apiHttpClient call
 * 2. Xoá dòng return mock
 * 3. Uncomment mapper function nếu field names khác camelCase
 *
 * Endpoints dự kiến:
 *   GET    /cart                   → CartItem[] (join highlight_feed, Videos)
 *   GET    /cart/summary           → { total_items, total_price }
 *   DELETE /cart/:course_id        → { success }
 *   PATCH  /cart/:course_id/save   → { saved: boolean }
 *   POST   /cart/apply-coupon      → CouponResult
 */

import { createApi } from "@/features/_shared/api-factories";
// [SWAP] Uncomment khi có real API endpoint:
// import { apiHttpClient } from "@/features/_shared/api-factories";
import type { CartItem, CartSummary, CouponResult } from "../types";
import { MOCK_CART_ITEMS } from "../mock-data"; // [MOCK] — xoá khi có API

// ─── Backend response mapper ─────────────────────────────────────────────────
// Uncomment khi backend sẵn sàng, điều chỉnh field names cho đúng.
//
// type CartItemApiResponse = {
//   id: number;
//   course_id: number;
//   course_name: string;
//   instructor_name: string;
//   thumbnail_url?: string;
//   level: "Beginner" | "Intermediate" | "Advanced";
//   duration: number;
//   price: number;
//   original_price?: number;
//   avg_rating?: number;
//   review_count?: number;
//   saved_for_later: boolean;
//   highlight_video_url?: string;
//   highlight_title?: string;
// };
//
// function mapCartItem(raw: CartItemApiResponse): CartItem {
//   return {
//     id: raw.id,
//     courseId: raw.course_id,
//     title: raw.course_name,
//     instructorName: raw.instructor_name,
//     thumbnailUrl: raw.thumbnail_url,
//     level: raw.level,
//     durationSeconds: raw.duration,
//     price: raw.price,
//     originalPrice: raw.original_price,
//     avgRating: raw.avg_rating,
//     reviewCount: raw.review_count,
//     savedForLater: raw.saved_for_later,
//     highlightVideoUrl: raw.highlight_video_url,
//     highlightTitle: raw.highlight_title,
//   };
// }
// ─────────────────────────────────────────────────────────────────────────────

export const cartApi = createApi({
  getCart: async (): Promise<CartItem[]> => {
    // [MOCK] Xoá 2 dòng dưới, uncomment real call khi có API
    return MOCK_CART_ITEMS;
    // const { data } = await apiHttpClient.get<CartItemApiResponse[]>("/cart");
    // return data.map(mapCartItem);
  },

  getCartSummary: async (): Promise<Pick<CartSummary, "itemCount" | "subtotal">> => {
    // [MOCK]
    const inCart = MOCK_CART_ITEMS.filter((i) => !i.savedForLater);
    return {
      itemCount: inCart.length,
      subtotal: inCart.reduce((sum, i) => sum + i.price, 0),
    };
    // [SWAP]
    // const { data } = await apiHttpClient.get<{ total_items: number; total_price: number }>("/cart/summary");
    // return { itemCount: data.total_items, subtotal: data.total_price };
  },

  removeFromCart: async (courseId: number): Promise<void> => {
    // [MOCK] no-op
    void courseId;
    // [SWAP] await apiHttpClient.delete(`/cart/${courseId}`);
  },

  saveForLater: async (courseId: number, saved: boolean): Promise<void> => {
    // [MOCK] no-op
    void courseId;
    void saved;
    // [SWAP] await apiHttpClient.patch(`/cart/${courseId}/save`, { saved });
  },

  applyCoupon: async (code: string): Promise<CouponResult> => {
    // [MOCK] luôn trả về lỗi — bảng Coupons chưa có trong DB
    void code;
    return { valid: false, message: "Tính năng coupon chưa khả dụng." };
    // [SWAP]
    // const { data } = await apiHttpClient.post<CouponResult>("/cart/apply-coupon", { code });
    // return data;
  },
});
