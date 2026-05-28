/**
 * Shared type cho mọi nơi hiển thị course card:
 * trang home, /courses, cart suggestion, v.v.
 *
 * Fields không có từ backend hiện tại (instructor, rating, enrolledCount)
 * để null/0 — UI tự graceful-degrade.
 * Khi backend bổ sung (xem README ## API Requirements), mapper tự pick up.
 */
export interface CourseCardData {
  id: number;
  title: string;
  /** null khi backend chưa join User */
  instructorName: string | null;
  /** null khi backend chưa join User */
  instructorAvatar: string | null;
  /** null khi backend chưa có avg_rating */
  avgRating: number | null;
  /** null khi backend chưa có review_count */
  reviewCount: number | null;
  /** null khi backend chưa có enrolled_count */
  enrolledCount: number | null;
  /** null = miễn phí */
  price: number | null;
  /** null khi course chưa có category */
  category: string | null;
  /** null khi course chưa upload video/thumbnail */
  thumbnailUrl: string | null;
  /** Beginner | Intermediate | Advanced */
  level: string | null;
}
