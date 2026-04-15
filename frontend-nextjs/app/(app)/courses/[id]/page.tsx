import CourseDetail from "@/features/courses/detail";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CourseDetailPage({ params }: Props) {
  const { id } = await params;
  return <CourseDetail courseId={Number(id)} />;
}
