import { buildPrivatePageMetadata } from "@/lib/metadata";
import CourseFormPage from "@/features/instructor/course-management/CourseFormPage";

export const metadata = buildPrivatePageMetadata(
  "Chỉnh sửa khóa học",
  "Cập nhật thông tin, cấu hình và nội dung khóa học.",
);

interface Props {
  params: Promise<{ courseId: string }>;
}

export default async function Page({ params }: Props) {
  const { courseId } = await params;
  return <CourseFormPage courseId={Number(courseId)} />;
}
