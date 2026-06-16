import { createApi, apiHttpClient } from "@/features/_shared/api-factories";
import type {
  WishlistListResponse,
  WishlistAddResponse,
  WishlistCheckResponse,
} from "../types";

export const wishlistApi = createApi({
  list: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<WishlistListResponse> => {
    const { data } = await apiHttpClient.get<WishlistListResponse>(
      "/course/wishlist",
      { params },
    );
    return data;
  },

  add: async (courseId: number): Promise<WishlistAddResponse> => {
    const { data } = await apiHttpClient.post<WishlistAddResponse>(
      "/course/wishlist",
      { courseId },
    );
    return data;
  },

  remove: async (courseId: number): Promise<void> => {
    await apiHttpClient.delete(`/course/wishlist/${courseId}`);
  },

  check: async (courseId: number): Promise<WishlistCheckResponse> => {
    const { data } = await apiHttpClient.get<WishlistCheckResponse>(
      `/course/wishlist/check/${courseId}`,
    );
    return data;
  },
});
