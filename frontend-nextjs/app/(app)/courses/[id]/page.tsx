import CourseDetail from "@/features/courses/detail";
import { API_URL } from "@/lib/env";

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
    
    const cleanDesc = course.description
      ? course.description.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 160) + "..."
      : "Chi tiết khóa học hấp dẫn trên LearnHub.";
      
    const title = `${course.name} | LearnHub`;
    const thumbnailUrl = course.video?.thumbnail || "/logo.png";
    const videoUrl = course.video?.url || undefined;
    
    return {
      title,
      description: cleanDesc,
      openGraph: {
        title,
        description: cleanDesc,
        images: [
          {
            url: thumbnailUrl,
            width: 1200,
            height: 630,
            alt: course.name,
          },
        ],
        type: "video.other",
        ...(videoUrl && {
          videos: [
            {
              url: videoUrl,
              width: 1200,
              height: 675,
            },
          ],
        }),
      },
    };
  } catch (err) {
    return {
      title: "Chi tiết khóa học | LearnHub",
    };
  }
}

export default async function CourseDetailPage({ params }: Props) {
  const { id } = await params;
  return <CourseDetail courseId={Number(id)} />;
}
