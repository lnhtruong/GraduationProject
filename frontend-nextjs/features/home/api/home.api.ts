/**
 * Home API
 * Endpoints for homepage data (featured courses, stats)
 *
 * TODO: Switch to real backend response when endpoint is ready.
 * Endpoint: GET /courses?featured=true&limit=4
 */

import { createApi } from "@/features/_shared/api-factories";
import type { FeaturedCourse } from "../types";
import { MOCK_FEATURED_COURSES } from "../data/mock_data";

// ─── Response shape from backend (map to FeaturedCourse) ─────────────────────
// Adjust field names here when real API is available.
//
// type CourseApiResponse = {
//   id: number;
//   title: string;
//   instructor_name: string;
//   instructor_avatar: string | null;
//   avg_rating: number;
//   review_count: number;
//   price: number | null;
//   category_name: string;
//   thumbnail_url: string;
// };
//
// function mapCourse(raw: CourseApiResponse): FeaturedCourse {
//   return {
//     id: raw.id,
//     title: raw.title,
//     instructor: raw.instructor_name,
//     instructorAvatar: raw.instructor_avatar,
//     rating: raw.avg_rating,
//     reviewCount: raw.review_count,
//     price: raw.price,
//     category: raw.category_name,
//     thumbnail: raw.thumbnail_url,
//   };
// }
// ─────────────────────────────────────────────────────────────────────────────

export const homeApi = createApi({
  getFeaturedCourses: async (): Promise<FeaturedCourse[]> => {
    // TODO: Replace with real API call:
    // const { data } = await apiClient.get<CourseApiResponse[]>("/courses", {
    //   params: { featured: true, limit: 4 },
    // });
    // return data.map(mapCourse);
    return MOCK_FEATURED_COURSES;
  },
});
