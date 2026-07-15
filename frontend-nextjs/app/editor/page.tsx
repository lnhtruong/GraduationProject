import { buildPrivatePageMetadata } from "@/lib/metadata";
import Editor from "@/features/editor";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export const metadata = buildPrivatePageMetadata(
  "Trình chỉnh sửa video",
  "Chỉnh sửa video học tập, mascot và tài nguyên sáng tạo trong StudyLoop.",
);

export default function Page() {
  return (
    <ProtectedRoute
      title="Trình chỉnh sửa video"
      description="Đăng nhập để mở dự án và chỉnh sửa video của bạn."
    >
      <Editor />
    </ProtectedRoute>
  );
}
