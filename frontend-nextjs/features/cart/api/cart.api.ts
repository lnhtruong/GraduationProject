import { createApi, apiHttpClient } from "@/features/_shared/api-factories";
import type { CartItem } from "../types";

// Raw shape BE trả về từ GET /course/carts (sau khi BE include Course + instructor)
type CartItemRaw = {
  id: number;
  courseId: number;
  created_at: string;
  course?: {
    id: number;
    name: string;
    price: number;
    level?: "Beginner" | "Intermediate" | "Advanced";
    duration?: string; // HH:MM:SS
    video?: { thumbnail?: string; url?: string } | null;
    instructor?: {
      firstName?: string | null;
      lastName?: string | null;
      first_name?: string | null;
      last_name?: string | null;
      avatarUrl?: string | null;
      avatar_url?: string | null;
    } | null;
  } | null;
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

function parseHHMMSS(d?: string): number {
  if (!d) return 0;
  const parts = d.split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}

function buildCartItems(raw: CartItemRaw[]): CartItem[] {
  return raw.map((item) => {
    const c = item.course;
    const inst = c?.instructor;
    const instructorName = inst
      ? `${inst.first_name ?? inst.firstName ?? ""} ${inst.last_name ?? inst.lastName ?? ""}`.trim() || "Giảng viên"
      : "Giảng viên";

    return {
      id: item.id,
      courseId: item.courseId,
      title: c?.name ?? "Khóa học trong giỏ",
      instructorName,
      thumbnailUrl: c?.video?.thumbnail,
      level: c?.level ?? "Beginner",
      durationSeconds: parseHHMMSS(c?.duration),
      price: c?.price ?? 0,
      avgRating: undefined,
      reviewCount: undefined,
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
});
