import { buildPrivatePageMetadata } from "@/lib/metadata";
import CourseFeedCreatePage from "@/features/instructor/course-management/CourseFeedCreatePage";

export const metadata = buildPrivatePageMetadata(
  "Tạo bài đăng bảng tin",
  "Tạo nội dung bảng tin mới cho khóa học.",
);

interface Props {
  params: Promise<{ courseId: string }>;
}

export default async function Page({ params }: Props) {
  const { courseId } = await params;
  return <CourseFeedCreatePage courseId={Number(courseId)} />;
}
