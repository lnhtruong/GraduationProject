import { createApi, apiHttpClient } from "@/features/_shared/api-factories";
import type { CartItem, CartSummary, CouponResult } from "../types";

// Raw item returned by GET /course/carts
type CartItemRaw = {
  id: number;
  courseId: number;
  created_at: string;
};

type CartApiResponse = {
  id: number;
  userId: number;
  totalQuantity: number;
  totalAmount: number;
  items: CartItemRaw[];
};

type AddToCartResponse = {
  id: number;
  cartId: number;
  courseId: number;
};

// Shape of GET /course/courses/:id we care about
type CourseBasic = {
  id: number;
  name: string;
  price: number;
  level?: "Beginner" | "Intermediate" | "Advanced";
  duration?: string; // HH:MM:SS
  userId?: number;
  video?: { thumbnail?: string; url?: string } | null;
};

function parseHHMMSS(d?: string): number {
  if (!d) return 0;
  const parts = d.split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}

async function fetchCourse(courseId: number): Promise<CourseBasic | null> {
  try {
    const { data } = await apiHttpClient.get<CourseBasic>(`/course/courses/${courseId}`);
    return data;
  } catch {
    return null;
  }
}

async function buildCartItems(raw: CartItemRaw[]): Promise<CartItem[]> {
  const courses = await Promise.all(raw.map((item) => fetchCourse(item.courseId)));
  return raw.map((item, i) => {
    const c = courses[i];
    return {
      id: item.id,
      courseId: item.courseId,
      title: c?.name ?? `Khoá học #${item.courseId}`,
      instructorName: "",
      thumbnailUrl: c?.video?.thumbnail,
      level: c?.level ?? "Beginner",
      durationSeconds: parseHHMMSS(c?.duration),
      price: c?.price ?? 0,
      originalPrice: undefined,
      avgRating: undefined,
      reviewCount: undefined,
      savedForLater: false,
    };
  });
}

export const cartApi = createApi({
  getCart: async (): Promise<CartItem[]> => {
    const { data } = await apiHttpClient.get<CartApiResponse>("/course/carts");
    return buildCartItems(data.items ?? []);
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

  applyCoupon: async (code: string): Promise<CouponResult> => {
    void code;
    return { valid: false, message: "Tính năng coupon chưa khả dụng." };
  },

  saveForLater: async (courseId: number, saved: boolean): Promise<void> => {
    void courseId;
    void saved;
  },
});
