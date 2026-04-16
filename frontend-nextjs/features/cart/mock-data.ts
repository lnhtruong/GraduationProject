/**
 * [MOCK] Cart mock data — xoá file này khi cart API sẵn sàng.
 *
 * Để swap sang real API:
 * 1. Xoá import MOCK_CART_ITEMS trong features/cart/index.tsx
 * 2. Dùng useCartQuery() từ cart.hooks.ts thay cho useState(MOCK_CART_ITEMS)
 * 3. Xoá file này
 */

import type { CartItem } from "./types";

// [MOCK] Danh sách khoá học trong giỏ hàng
export const MOCK_CART_ITEMS: CartItem[] = [
  {
    id: 1,
    courseId: 101,
    title: "Lập trình Python từ cơ bản đến nâng cao",
    instructorName: "Nguyễn Văn An",
    thumbnailUrl: "https://placehold.co/400x225/E8A020/FFFFFF?text=Python",
    level: "Beginner",
    durationSeconds: 45000, // 12h 30p
    price: 1_200_000,
    originalPrice: 2_000_000,
    avgRating: 4.8,
    reviewCount: 234,
    savedForLater: false,
    highlightVideoUrl: undefined, // [MOCK] chưa có video — swap: lấy từ Videos.url
    highlightTitle: undefined,
  },
  {
    id: 2,
    courseId: 202,
    title: "Machine Learning với TensorFlow và PyTorch",
    instructorName: "Trần Thị Bình",
    thumbnailUrl: "https://placehold.co/400x225/6366F1/FFFFFF?text=ML",
    level: "Intermediate",
    durationSeconds: 64800, // 18h
    price: 1_500_000,
    originalPrice: undefined,
    avgRating: 4.6,
    reviewCount: 187,
    savedForLater: false,
    highlightVideoUrl: undefined,
    highlightTitle: undefined,
  },
  {
    id: 3,
    courseId: 303,
    title: "React & Next.js — Xây dựng ứng dụng thực tế",
    instructorName: "Lê Minh Châu",
    thumbnailUrl: "https://placehold.co/400x225/0EA5E9/FFFFFF?text=React",
    level: "Intermediate",
    durationSeconds: 54000, // 15h
    price: 990_000,
    originalPrice: 1_500_000,
    avgRating: 4.9,
    reviewCount: 512,
    savedForLater: true, // [MOCK] item này đang ở "Saved for later"
    highlightVideoUrl: undefined,
    highlightTitle: undefined,
  },
];
