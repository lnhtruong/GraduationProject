import { ProtectedRoute } from "@/components/ProtectedRoute";
import { MyCoursesPage } from "@/features/courses/enrolled/components/MyCoursesPage";

export const metadata = {
  title: "Khóa học của tôi",
};

export default function MyCoursesRoute() {
  return (
    <ProtectedRoute>
      <MyCoursesPage />
    </ProtectedRoute>
  );
}
