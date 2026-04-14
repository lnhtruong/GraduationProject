/**
 * Cart React Query Hooks
 * Pattern giống features/home/api/home.hooks.ts
 *
 * [MOCK] useCartQuery hiện trả về MOCK_CART_ITEMS qua cartApi.getCart()
 * [SWAP] Khi backend sẵn sàng: chỉ cần swap cartApi.getCart() để gọi real endpoint,
 *        hooks này không cần thay đổi.
 */

import {
  createQueryHooks,
  createMutationHooks,
} from "@/features/_shared/react-query-factories";
import { cartApi } from "./cart.api";

// ─── Queries ──────────────────────────────────────────────────────────────────

// Danh sách đầy đủ cart items — dùng trong CartPage
const cartItemsHooks = createQueryHooks(
  "cart",
  ["items"],
  cartApi.getCart,
  { staleTime: 30_000 }, // 30s
);

export const cartKeys = cartItemsHooks.keys;
export const useCartQuery = cartItemsHooks.useQuery;

// Summary (count + subtotal) — dùng cho Header badge
const cartSummaryHooks = createQueryHooks(
  "cart",
  ["summary"],
  cartApi.getCartSummary,
  { staleTime: 30_000 },
);

export const useCartSummary = cartSummaryHooks.useQuery;

// ─── Mutations ────────────────────────────────────────────────────────────────

export const useRemoveFromCart = createMutationHooks<void, number>(
  "cart",
  "remove",
  cartApi.removeFromCart,
  {
    onSuccess: (_data, _vars, queryClient) => {
      queryClient.invalidateQueries({ queryKey: cartKeys.root });
    },
  },
);

export const useApplyCoupon = createMutationHooks<
  Awaited<ReturnType<typeof cartApi.applyCoupon>>,
  string
>("cart", "apply-coupon", cartApi.applyCoupon);
