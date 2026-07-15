import { ProtectedRoute } from "@/components/ProtectedRoute";
import { WishlistPage } from "@/features/wishlist/components/WishlistPage";

export const metadata = {
  title: "Khóa học đã lưu",
};

export default function WishlistPageRoute() {
  return (
    <ProtectedRoute
      title="Khóa học đã lưu"
      description="Đăng nhập để xem và quản lý danh sách khóa học bạn đã lưu."
    >
      <WishlistPage />
    </ProtectedRoute>
  );
}
