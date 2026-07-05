import { buildPrivatePageMetadata } from "@/lib/metadata";
import CourseFormPage from "@/features/instructor/course-management/CourseFormPage";

export const metadata = buildPrivatePageMetadata(
  "Tạo khóa học",
  "Tạo khóa học mới, thiết lập thông tin và nội dung giảng dạy.",
);

export default function Page() {
  return <CourseFormPage />;
}
