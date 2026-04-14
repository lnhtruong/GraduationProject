import LessonListPage from "@/features/instructor/course-management/LessonListPage";

export const metadata = { title: "Bài học — Teacher Mode" };

interface Props {
  params: Promise<{ courseId: string }>;
}

export default async function Page({ params }: Props) {
  const { courseId } = await params;
  return <LessonListPage courseId={Number(courseId)} />;
}
