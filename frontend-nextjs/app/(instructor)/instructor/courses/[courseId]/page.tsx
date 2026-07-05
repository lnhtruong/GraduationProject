import { buildPrivatePageMetadata } from "@/lib/metadata";
import CourseOverviewPage from "@/features/instructor/course-management/CourseOverviewPage";

export const metadata = buildPrivatePageMetadata(
  "Tổng quan khóa học",
  "Xem tổng quan, trạng thái và nội dung quản lý của khóa học.",
);

interface Props {
  params: Promise<{ courseId: string }>;
}

export default async function Page({ params }: Props) {
  const { courseId } = await params;
  return <CourseOverviewPage courseId={Number(courseId)} />;
}
