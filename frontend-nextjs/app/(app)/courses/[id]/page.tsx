import CourseDetail from "@/features/courses/detail";
import { API_URL } from "@/lib/env";
import { buildCourseMetadata } from "@/lib/metadata";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  try {
    const res = await fetch(`${API_URL}/course/courses/${id}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) {
      return {
        title: "Chi tiết khóa học | LearnHub",
      };
    }
    const course = await res.json();
    return buildCourseMetadata(course, undefined, "video.other");
  } catch {
    return {
      title: "Chi tiết khóa học | LearnHub",
    };
  }
}

export default async function CourseDetailPage({ params }: Props) {
  const { id } = await params;
  return <CourseDetail courseId={Number(id)} />;
}
