import { buildPrivatePageMetadata } from "@/lib/metadata";
import AdminCoursesPage from "@/features/admin/components/courses/AdminCoursesPage";

export const metadata = buildPrivatePageMetadata(
  "Quản lý khóa học",
  "Kiểm duyệt và quản trị danh sách khóa học trên LearnHub.",
);

export default function Page() {
  return <AdminCoursesPage />;
}
