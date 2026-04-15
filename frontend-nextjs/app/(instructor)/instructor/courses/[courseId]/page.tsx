import CourseOverviewPage from "@/features/instructor/course-management/CourseOverviewPage";

export const metadata = { title: "Chi tiết khóa học — Teacher Mode" };

interface Props {
  params: Promise<{ courseId: string }>;
}

export default async function Page({ params }: Props) {
  const { courseId } = await params;
  return <CourseOverviewPage courseId={Number(courseId)} />;
}
