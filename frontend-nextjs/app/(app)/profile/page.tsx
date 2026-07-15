import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ProfileContent } from "@/features/profile/components/ProfileContent";
import { buildPrivatePageMetadata } from "@/lib/metadata";

export const metadata = buildPrivatePageMetadata(
  "Hồ sơ cá nhân",
  "Xem và cập nhật thông tin tài khoản, vai trò và hồ sơ cá nhân trên StudyLoop.",
);

export default function ProfilePage() {
  return (
    <ProtectedRoute
      title="Hồ sơ cá nhân"
      description="Đăng nhập để xem và cập nhật thông tin tài khoản."
    >
      <ProfileContent />
    </ProtectedRoute>
  );
}
