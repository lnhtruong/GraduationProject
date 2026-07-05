import { buildPrivatePageMetadata } from "@/lib/metadata";
import CoursesPage from "@/features/instructor/components/courses/CoursesPage";

export const metadata = buildPrivatePageMetadata(
  "Khóa học của giảng viên",
  "Quản lý danh sách khóa học, trạng thái xuất bản và nội dung giảng dạy.",
);

export default function Page() {
  return <CoursesPage />;
}
