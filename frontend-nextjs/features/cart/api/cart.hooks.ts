import {
  createQueryHooks,
  createMutationHooks,
} from "@/features/_shared/react-query-factories";
import { useAuthState } from "@/features/auth/hooks/useAuth";
import { cartApi } from "./cart.api";

// ─── Queries ──────────────────────────────────────────────────────────────────

const cartItemsHooks = createQueryHooks("cart", ["items"], cartApi.getCart, {
  staleTime: 30_000,
});

export const cartKeys = cartItemsHooks.keys;

export function useCartQuery(enabled = true) {
  const { isAuthenticated } = useAuthState();
  return cartItemsHooks.useQuery(isAuthenticated && enabled);
}

// Derive từ useCartQuery — không gọi API thêm
export function useCartSummary(enabled = true) {
  const { data: items, ...rest } = useCartQuery(enabled);
  const itemCount = items?.length ?? 0;
  const subtotal = items?.reduce((sum, i) => sum + i.price, 0) ?? 0;
  return { data: { itemCount, subtotal }, ...rest };
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export const useAddToCart = createMutationHooks<
  Awaited<ReturnType<typeof cartApi.addToCart>>,
  number
>("cart", "add", cartApi.addToCart, {
  onSuccess: (_data, _vars, queryClient) => {
    queryClient.invalidateQueries({ queryKey: cartKeys.root });
  },
});

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

export const useSaveForLater = createMutationHooks<
  void,
  { courseId: number; saved: boolean }
>(
  "cart",
  "saveForLater",
  ({ courseId, saved }) => cartApi.saveForLater(courseId, saved),
  {
    onSuccess: (_data, _vars, queryClient) => {
      queryClient.invalidateQueries({ queryKey: cartKeys.root });
    },
  },
);

export function useIsInCart(courseId: number): boolean {
  const { data: items } = useCartQuery();
  return (items ?? []).some((item) => item.courseId === courseId);
}
