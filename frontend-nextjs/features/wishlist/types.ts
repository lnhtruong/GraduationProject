export interface WishlistInstructor {
  id: number;
  name: string;
  avatarUrl: string | null;
}

export interface WishlistItem {
  id: number;
  name: string;
  thumbnailUrl: string | null;
  price: number;
  level: string | null;
  duration: string | null;
  status: string;
  instructor: WishlistInstructor | null;
  avgRating: number;
  reviewCount: number;
  enrollCount: number;
  addedAt: string;
}

export interface WishlistListResponse {
  data: WishlistItem[];
  total: number;
  page: number;
  limit: number;
}

export interface WishlistAddResponse {
  inWishlist: true;
  courseId: number;
}

export interface WishlistCheckResponse {
  inWishlist: boolean;
}
