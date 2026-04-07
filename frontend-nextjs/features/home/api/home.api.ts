/**
 * Home API
 * Endpoints for homepage data (featured courses, stats)
 *
 * TODO: Uncomment apiClient calls and remove mock data once backend is ready.
 * Endpoint: GET /courses?featured=true&limit=4
 */

// import { apiClient } from "@/lib/http";
import type { FeaturedCourse } from "../types";

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

const MOCK_FEATURED_COURSES: FeaturedCourse[] = [
  {
    id: 1,
    title: "Toán 10 - Phương trình và bất phương trình",
    instructor: "Nguyễn Văn A",
    instructorAvatar: null,
    rating: 4.8,
    reviewCount: 1234,
    price: null,
    category: "Toán học",
    thumbnail: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=225&fit=crop",
  },
  {
    id: 2,
    title: "Vật lý 11 - Cơ học chất điểm",
    instructor: "Trần Thị B",
    instructorAvatar: null,
    rating: 4.9,
    reviewCount: 2345,
    price: 299000,
    category: "Vật lý",
    thumbnail: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&h=225&fit=crop",
  },
  {
    id: 3,
    title: "Hóa 12 - Phản ứng hóa học",
    instructor: "Lê Văn C",
    instructorAvatar: null,
    rating: 4.7,
    reviewCount: 1567,
    price: 399000,
    category: "Hóa học",
    thumbnail: "https://images.unsplash.com/photo-1554475901-4538ddfbccc2?w=400&h=225&fit=crop",
  },
  {
    id: 4,
    title: "Ngữ văn 10 - Văn học Việt Nam",
    instructor: "Phạm Thị D",
    instructorAvatar: null,
    rating: 4.8,
    reviewCount: 3456,
    price: null,
    category: "Văn học",
    thumbnail: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=225&fit=crop",
  },
];

export const homeApi = {
  getFeaturedCourses: async (): Promise<FeaturedCourse[]> => {
    // TODO: Replace with real API call:
    // const { data } = await apiClient.get<CourseApiResponse[]>("/courses", {
    //   params: { featured: true, limit: 4 },
    // });
    // return data.map(mapCourse);
    return MOCK_FEATURED_COURSES;
  },
};
