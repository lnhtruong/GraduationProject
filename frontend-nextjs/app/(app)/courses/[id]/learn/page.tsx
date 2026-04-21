import CourseLearnPage from "@/features/courses/learn";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <CourseLearnPage courseId={Number(id)} />;
}
