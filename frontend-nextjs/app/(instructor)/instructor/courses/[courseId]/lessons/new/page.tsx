import { buildPrivatePageMetadata } from "@/lib/metadata";
import LessonFormPage from "@/features/instructor/course-management/LessonFormPage";

export const metadata = buildPrivatePageMetadata(
  "Tạo bài học",
  "Tạo bài học mới, thêm video và hoạt động học tập cho khóa học.",
);

interface Props {
  params: Promise<{ courseId: string }>;
}

export default async function Page({ params }: Props) {
  const { courseId } = await params;
  return <LessonFormPage courseId={Number(courseId)} />;
}
