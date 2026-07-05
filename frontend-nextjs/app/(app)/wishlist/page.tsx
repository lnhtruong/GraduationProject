import { ProtectedRoute } from "@/components/ProtectedRoute";
import { WishlistPage } from "@/features/wishlist/components/WishlistPage";

export const metadata = {
  title: "Khóa học đã lưu",
};

export default function WishlistPageRoute() {
  return (
    <ProtectedRoute>
      <WishlistPage />
    </ProtectedRoute>
  );
}
