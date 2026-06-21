import type { Metadata } from "next";

export function buildCourseMetadata(
  course: any,
  titleSuffix?: string,
  ogType: string = "video.other"
): Metadata {
  const cleanDesc = course.description
    ? course.description
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 160) + "..."
    : "Chi tiết khóa học hấp dẫn trên LearnHub.";

  const title = titleSuffix
    ? `${course.name} ${titleSuffix} | LearnHub`
    : `${course.name} | LearnHub`;
    
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
      type: ogType,
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
}
