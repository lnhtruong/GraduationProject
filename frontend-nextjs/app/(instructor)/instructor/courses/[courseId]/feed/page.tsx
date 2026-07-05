import { buildPrivatePageMetadata } from "@/lib/metadata";
import CourseFeedManagementPage from "@/features/instructor/course-management/CourseFeedManagementPage";

export const metadata = buildPrivatePageMetadata(
  "Quản lý bảng tin khóa học",
  "Quản lý nội dung video ngắn và bài đăng bảng tin của khóa học.",
);

interface Props {
  params: Promise<{ courseId: string }>;
}

export default async function Page({ params }: Props) {
  const { courseId } = await params;
  return <CourseFeedManagementPage courseId={Number(courseId)} />;
}
