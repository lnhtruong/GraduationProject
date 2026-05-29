import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "../types";

interface CartState {
  items: CartItem[];

  // Actions
  setItems: (items: CartItem[]) => void;
  removeItem: (courseId: number) => void;
  saveForLater: (courseId: number) => void;
  moveToCart: (courseId: number) => void;
  clearCart: () => void;

  // Computed
  getInCartItems: () => CartItem[];
  getSavedItems: () => CartItem[];
  getItemCount: () => number;
  getSubtotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

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

      clearCart: () => set({ items: [] }),

      getInCartItems: () => get().items.filter((i) => !i.savedForLater),

      getSavedItems: () => get().items.filter((i) => i.savedForLater),

      getItemCount: () => get().items.filter((i) => !i.savedForLater).length,

      getSubtotal: () =>
        get()
          .items.filter((i) => !i.savedForLater)
          .reduce((sum, i) => sum + i.price, 0),
    }),
    {
      name: "cart-storage",
      partialize: (state) => ({ items: state.items }),
    },
  ),
);
