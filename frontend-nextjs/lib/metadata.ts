import type { Metadata } from "next";
import { BRAND } from "@/lib/brand";

const SITE_NAME = BRAND.name;
const DEFAULT_IMAGE = BRAND.ogImage;

interface PageMetadataOptions {
  title: string;
  description: string;
  path?: string;
  image?: string;
  noIndex?: boolean;
}

interface CourseMetadataInput {
  name: string;
  description?: string | null;
  video?: {
    thumbnail?: string | null;
    url?: string | null;
  } | null;
}

type CourseOpenGraphType = "video.other" | "video.episode";

export function buildPageMetadata({
  title,
  description,
  path,
  image = DEFAULT_IMAGE,
  noIndex = false,
}: PageMetadataOptions): Metadata {
  return {
    title,
    description,
    alternates: path ? { canonical: path } : undefined,
    robots: noIndex
      ? {
          index: false,
          follow: false,
          googleBot: {
            index: false,
            follow: false,
          },
        }
      : undefined,
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      siteName: SITE_NAME,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${SITE_NAME}`,
      description,
      images: [image],
    },
  };
}

export function buildPrivatePageMetadata(
  title: string,
  description: string,
): Metadata {
  return buildPageMetadata({ title, description, noIndex: true });
}

export function buildCourseMetadata(
  course: CourseMetadataInput,
  titleSuffix?: string,
  ogType: CourseOpenGraphType = "video.other",
): Metadata {
  const cleanDesc = course.description
    ? course.description
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 160) + "..."
    : `Chi tiết khóa học trên ${BRAND.name}.`;

  const title = titleSuffix ? `${course.name} ${titleSuffix}` : course.name;
    
  const thumbnailUrl = course.video?.thumbnail || BRAND.ogImage;
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
