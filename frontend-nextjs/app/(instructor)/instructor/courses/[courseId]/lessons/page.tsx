import { redirect } from "next/navigation";

export const metadata = { title: "Bài học - Chế độ giảng viên" };

interface Props {
  params: Promise<{ courseId: string }>;
}

export default async function Page({ params }: Props) {
  const { courseId } = await params;
  redirect(`/instructor/courses/${courseId}`);
}
