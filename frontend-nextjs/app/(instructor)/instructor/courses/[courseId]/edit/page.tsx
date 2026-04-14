import CourseFormPage from "@/features/instructor/course-management/CourseFormPage";

export const metadata = { title: "Sửa khóa học — Teacher Mode" };

interface Props {
  params: Promise<{ courseId: string }>;
}

export default async function Page({ params }: Props) {
  const { courseId } = await params;
  return <CourseFormPage courseId={Number(courseId)} />;
}
