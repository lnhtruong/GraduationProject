/**
 * Cart feature types
 * Mapping từ DB schema: cart_items JOIN Courses JOIN Users JOIN Reviews JOIN highlight_feed JOIN Videos
 */

export interface CartItem {
  id: number;               // cart_items.id (PK)
  courseId: number;         // cart_items.course_id → Courses.id
  title: string;            // Courses.name
  instructorName: string;   // Users.first_name + Users.last_name (giảng viên)
  thumbnailUrl?: string;    // Courses.thumbnail_url
  level: "Beginner" | "Intermediate" | "Advanced"; // Courses.level
  durationSeconds: number;  // Courses.duration (seconds)
  price: number;            // Courses.price
  originalPrice?: number;   // Courses.original_price
  avgRating?: number;       // AVG(Reviews.rating) per course
  reviewCount?: number;     // COUNT(Reviews.id) per course
  savedForLater: boolean;   // cart_items.saved_for_later
  // Highlight video — từ highlight_feed JOIN Videos
  highlightVideoUrl?: string; // Videos.url WHERE type=HIGHLIGHT AND status=READY
  highlightTitle?: string;    // highlight_feed.title
}

export interface CartSummary {
  subtotal: number;       // SUM(Courses.price) for in-cart items
  discountAmount: number; // từ coupon
  couponCode?: string;
  total: number;          // subtotal - discountAmount
  itemCount: number;      // COUNT of in-cart items (không tính saved)
}

export interface CouponResult {
  valid: boolean;
  discountAmount?: number;
  message?: string;       // "Mã không hợp lệ", "Đã hết hạn", v.v.
}
