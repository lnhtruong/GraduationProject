import { buildPrivatePageMetadata } from "@/lib/metadata";
import CourseFeedEditPage from "@/features/instructor/course-management/CourseFeedEditPage";

export const metadata = buildPrivatePageMetadata(
  "Chỉnh sửa bài đăng bảng tin",
  "Cập nhật nội dung bảng tin và video ngắn của khóa học.",
);

interface Props {
  params: Promise<{ courseId: string; feedId: string }>;
}

export default async function Page({ params }: Props) {
  const { courseId, feedId } = await params;
  return <CourseFeedEditPage courseId={Number(courseId)} feedId={Number(feedId)} />;
}
