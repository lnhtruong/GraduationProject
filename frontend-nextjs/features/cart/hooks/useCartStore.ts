/**
 * Cart Zustand Store
 * Pattern giống store/auth.ts — persist middleware, camelCase methods.
 *
 * [MOCK NOTE] getItemCount() và getSubtotal() tính từ local items.
 * [SWAP] Khi backend sẵn sàng: lấy count từ useCartSummary() (React Query)
 *        thay vì tính local. Store chỉ giữ optimistic update cho Header badge.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "../types";

interface CartState {
  items: CartItem[];
  couponCode: string | null;
  discountAmount: number;

  // Actions
  setItems: (items: CartItem[]) => void;
  removeItem: (courseId: number) => void;
  saveForLater: (courseId: number) => void;
  moveToCart: (courseId: number) => void;
  applyCoupon: (code: string, discount: number) => void;
  clearCoupon: () => void;
  clearCart: () => void;

  // Computed
  getInCartItems: () => CartItem[];
  getSavedItems: () => CartItem[];
  getItemCount: () => number;   // [MOCK] tính từ local — swap với API summary khi có backend
  getSubtotal: () => number;    // [MOCK] tính từ local
  getTotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      couponCode: null,
      discountAmount: 0,

      setItems: (items) => set({ items }),

      removeItem: (courseId) =>
        set((state) => ({
          items: state.items.filter((i) => i.courseId !== courseId),
        })),

      saveForLater: (courseId) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.courseId === courseId ? { ...i, savedForLater: true } : i,
          ),
        })),

      moveToCart: (courseId) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.courseId === courseId ? { ...i, savedForLater: false } : i,
          ),
        })),

      applyCoupon: (code, discount) =>
        set({ couponCode: code, discountAmount: discount }),

      clearCoupon: () => set({ couponCode: null, discountAmount: 0 }),

      clearCart: () => set({ items: [], couponCode: null, discountAmount: 0 }),

      getInCartItems: () => get().items.filter((i) => !i.savedForLater),

      getSavedItems: () => get().items.filter((i) => i.savedForLater),

      // [MOCK] tính từ local — swap: lấy từ GET /cart/summary
      getItemCount: () => get().items.filter((i) => !i.savedForLater).length,

      // [MOCK] tính từ local — swap: lấy từ GET /cart/summary
      getSubtotal: () =>
        get()
          .items.filter((i) => !i.savedForLater)
          .reduce((sum, i) => sum + i.price, 0),

      getTotal: () => {
        const subtotal = get().getSubtotal();
        return Math.max(0, subtotal - get().discountAmount);
      },
    }),
    {
      name: "cart-storage",
      // chỉ persist items + coupon (discountAmount tính lại khi load)
      partialize: (state) => ({
        items: state.items,
        couponCode: state.couponCode,
      }),
    },
  ),
);
