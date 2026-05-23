import { createApi, apiHttpClient } from "@/features/_shared/api-factories";
import type { FeaturedCourse } from "@/features/home/types";

type CourseApiResponse = {
  id: number;
  name: string;
  description?: string;
  categories: { id: number; name: string }[] | string | unknown;
  level: string;
  duration: string;
  language: string;
  price: number;
  userId: number;
  status: string;
  video?: { thumbnail?: string } | null;
};

type CoursesListRaw =
  | { data: CourseApiResponse[]; pagination?: unknown }
  | CourseApiResponse[];

export interface BrowseCoursesParams {
  page?: number;
  limit?: number;
}

function mapToBrowseCourse(raw: CourseApiResponse): FeaturedCourse {
  const cats = Array.isArray(raw.categories)
    ? (raw.categories as { name: string }[])
    : [];
  const category = cats[0]?.name ?? "Khoá học";

  return {
    id: raw.id,
    title: raw.name,
    instructor: "",
    instructorAvatar: null,
    rating: 0,
    reviewCount: 0,
    price: raw.price === 0 ? null : raw.price,
    category,
    thumbnail: raw.video?.thumbnail ?? "",
  };
}

export const courseBrowseApi = createApi({
  getCourses: async (params: BrowseCoursesParams = {}): Promise<FeaturedCourse[]> => {
    const { data } = await apiHttpClient.get<CoursesListRaw>("/course/courses", {
      params: {
        page: params.page ?? 1,
        limit: params.limit ?? 12,
        status: "publish",
      },
    });

    const raw = Array.isArray(data) ? data : data.data;
    return raw.map(mapToBrowseCourse);
  },
});
