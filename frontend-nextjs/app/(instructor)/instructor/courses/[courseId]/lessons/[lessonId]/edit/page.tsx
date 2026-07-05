import { buildPrivatePageMetadata } from "@/lib/metadata";
import LessonFormPage from "@/features/instructor/course-management/LessonFormPage";

export const metadata = buildPrivatePageMetadata(
  "Chỉnh sửa bài học",
  "Cập nhật bài học, video và hoạt động học tập trong khóa học.",
);

interface Props {
  params: Promise<{ courseId: string; lessonId: string }>;
}

export default async function Page({ params }: Props) {
  const { courseId, lessonId } = await params;
  return <LessonFormPage courseId={Number(courseId)} lessonId={Number(lessonId)} />;
}
