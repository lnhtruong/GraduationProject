import CourseFeedEditPage from "@/features/instructor/course-management/CourseFeedEditPage";

export const metadata = { title: "Sửa feed khóa học — Teacher Mode" };

interface Props {
  params: Promise<{ courseId: string; feedId: string }>;
}

export default async function Page({ params }: Props) {
  const { courseId, feedId } = await params;
  return (
    <CourseFeedEditPage courseId={Number(courseId)} feedId={Number(feedId)} />
  );
}
