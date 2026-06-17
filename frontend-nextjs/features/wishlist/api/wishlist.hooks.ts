import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createKeyFactory } from "@/lib/queryKeys";
import { useAuthState } from "@/features/auth/hooks/useAuth";
import { wishlistApi } from "./wishlist.api";
import type { WishlistListResponse } from "../types";

const wishlistKeys = createKeyFactory("wishlist");

// Query key constants
export const WISHLIST_IDS_KEY = wishlistKeys.custom("ids");
export const WISHLIST_LIST_KEY = wishlistKeys.custom("list");

// ─── Hook 1: Batch IDs cho mọi CourseCard ────────────────────────────────────
// Gọi 1 lần, cache Infinity, chỉ re-fetch khi toggle thành công.
export function useWishlistIdsQuery() {
  const { isAuthenticated } = useAuthState();

  return useQuery({
    queryKey: WISHLIST_IDS_KEY,
    queryFn: async (): Promise<number[]> => {
      const res = await wishlistApi.list({ limit: 100 });
      return res.data.map((item) => item.id);
    },
    enabled: isAuthenticated,
    staleTime: Infinity,
  });
}

// Helper: check xem 1 courseId có trong wishlist không, dùng cache của useWishlistIdsQuery
export function useIsInWishlist(courseId: number): boolean {
  const { data: ids } = useWishlistIdsQuery();
  if (!ids) return false;
  return ids.includes(courseId);
}

// ─── Hook 2: Danh sách đầy đủ cho WishlistPage (có pagination) ───────────────
export function useWishlistQuery(page = 1, limit = 20) {
  const { isAuthenticated } = useAuthState();

  return useQuery<WishlistListResponse>({
    queryKey: wishlistKeys.custom("list", { page, limit }),
    queryFn: () => wishlistApi.list({ page, limit }),
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
}

// ─── Hook 3: Toggle wishlist với optimistic update ───────────────────────────
export function useToggleWishlistMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      courseId,
      currentlyInWishlist,
    }: {
      courseId: number;
      currentlyInWishlist: boolean;
    }) => {
      if (currentlyInWishlist) {
        await wishlistApi.remove(courseId);
      } else {
        await wishlistApi.add(courseId);
      }
    },

    onMutate: async ({ courseId, currentlyInWishlist }) => {
      // Hủy các request đang bay để tránh ghi đè optimistic update
      await queryClient.cancelQueries({ queryKey: WISHLIST_IDS_KEY });

      // Snapshot state hiện tại để rollback khi lỗi
      const previousIds = queryClient.getQueryData<number[]>(WISHLIST_IDS_KEY);

      // Optimistic update: cập nhật cache ngay lập tức
      queryClient.setQueryData<number[]>(WISHLIST_IDS_KEY, (old = []) => {
        if (currentlyInWishlist) {
          return old.filter((id) => id !== courseId);
        }
        return [...old, courseId];
      });

      return { previousIds };
    },

    onError: (_err, _vars, context) => {
      // Rollback về snapshot cũ
      if (context?.previousIds !== undefined) {
        queryClient.setQueryData(WISHLIST_IDS_KEY, context.previousIds);
      }
      toast.error("Không thể cập nhật danh sách lưu. Vui lòng thử lại.");
    },

    onSettled: () => {
      // Đồng bộ lại cả 2 cache sau khi settle (dù success hay error)
      void queryClient.invalidateQueries({ queryKey: WISHLIST_IDS_KEY });
      void queryClient.invalidateQueries({ queryKey: WISHLIST_LIST_KEY });
    },
  });
}
