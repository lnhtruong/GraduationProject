import {
  createQueryHooks,
  createMutationHooks,
} from "@/features/_shared/react-query-factories";
import { cartApi } from "./cart.api";

// ─── Queries ──────────────────────────────────────────────────────────────────

const cartItemsHooks = createQueryHooks(
  "cart",
  ["items"],
  cartApi.getCart,
  { staleTime: 30_000 },
);

export const cartKeys = cartItemsHooks.keys;
export const useCartQuery = cartItemsHooks.useQuery;

const cartSummaryHooks = createQueryHooks(
  "cart",
  ["summary"],
  cartApi.getCartSummary,
  { staleTime: 30_000 },
);

export const useCartSummary = cartSummaryHooks.useQuery;

// ─── Mutations ────────────────────────────────────────────────────────────────

export const useAddToCart = createMutationHooks<
  Awaited<ReturnType<typeof cartApi.addToCart>>,
  number
>(
  "cart",
  "add",
  cartApi.addToCart,
  {
    onSuccess: (_data, _vars, queryClient) => {
      queryClient.invalidateQueries({ queryKey: cartKeys.root });
    },
  },
);

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
