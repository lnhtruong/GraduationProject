import { buildPrivatePageMetadata } from "@/lib/metadata";

export const metadata = buildPrivatePageMetadata(
  "Học khóa học",
  "Tiếp tục học bài giảng, xem video và làm bài kiểm tra trong khóa học StudyLoop.",
);

import CourseLearnPage from "@/features/courses/learn";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <CourseLearnPage courseId={Number(id)} />;
}
