import CourseFeedCreatePage from "@/features/instructor/course-management/CourseFeedCreatePage";

export const metadata = { title: "Tạo feed khóa học — Teacher Mode" };

interface Props {
  params: Promise<{ courseId: string }>;
}

export default async function Page({ params }: Props) {
  const { courseId } = await params;
  return <CourseFeedCreatePage courseId={Number(courseId)} />;
}
