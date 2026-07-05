import { ProtectedRoute } from "@/components/ProtectedRoute";
import { MyCoursesPage } from "@/features/my-courses/components/MyCoursesPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Học tập của tôi",
  description: "Quản lý và tiếp tục các khóa học bạn đang tham gia trên LearnHub.",
};

export default function Page() {
  return (
    <ProtectedRoute>
      <MyCoursesPage />
    </ProtectedRoute>
  );
}
