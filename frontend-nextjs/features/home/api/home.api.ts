import { createApi, apiHttpClient } from "@/features/_shared/api-factories";
import type { FeaturedCourse } from "../types";

// Shape BE hiện trả về từ GET /course/courses
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
};

function mapCourse(raw: CourseApiResponse): FeaturedCourse {
  // categories lưu dạng JSON array [{id, name}] hoặc string
  const cats = Array.isArray(raw.categories)
    ? (raw.categories as { name: string }[])
    : [];
  const category = cats[0]?.name ?? "Khoá học";

  return {
    id: raw.id,
    title: raw.name,
    instructor: "",           // BE chưa join user — hiển thị trống tạm thời
    instructorAvatar: null,
    rating: 0,                // BE chưa có avg_rating
    reviewCount: 0,
    price: raw.price === 0 ? null : raw.price,
    category,
    thumbnail: "",            // BE chưa có thumbnail_url
  };
}

export const homeApi = createApi({
  getFeaturedCourses: async (): Promise<FeaturedCourse[]> => {
    const { data } = await apiHttpClient.get<
      { data: CourseApiResponse[]; pagination: unknown } | CourseApiResponse[]
    >("/course/courses", {
      params: { limit: 8, page: 1 },
    });

    const courses = Array.isArray(data) ? data : data.data;
    return courses.map(mapCourse);
  },
});
