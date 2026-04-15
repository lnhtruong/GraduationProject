import CourseFeedManagementPage from "@/features/instructor/course-management/CourseFeedManagementPage";

export const metadata = { title: "Quản lý feed khóa học — Teacher Mode" };

interface Props {
  params: Promise<{ courseId: string }>;
}

export default async function Page({ params }: Props) {
  const { courseId } = await params;
  return <CourseFeedManagementPage courseId={Number(courseId)} />;
}
