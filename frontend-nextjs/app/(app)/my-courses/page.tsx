import { ProtectedRoute } from "@/components/ProtectedRoute";
import { MyCoursesPage } from "@/features/my-courses/components/MyCoursesPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Học tập của tôi",
  description: "Quản lý và tiếp tục các khóa học bạn đang tham gia trên StudyLoop.",
};

export default function Page() {
  return (
    <ProtectedRoute
      title="Học tập của tôi"
      description="Đăng nhập để tiếp tục khóa học và theo dõi tiến độ cá nhân."
    >
      <MyCoursesPage />
    </ProtectedRoute>
  );
}
