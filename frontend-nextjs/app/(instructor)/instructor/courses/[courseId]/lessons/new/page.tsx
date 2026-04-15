import LessonFormPage from "@/features/instructor/course-management/LessonFormPage";

export const metadata = { title: "Tạo bài học — Teacher Mode" };

interface Props {
  params: Promise<{ courseId: string }>;
}

export default async function Page({ params }: Props) {
  const { courseId } = await params;
  return <LessonFormPage courseId={Number(courseId)} />;
}
