import { apiHttpClient } from "@/features/_shared/api-factories";
import type { CourseCardData } from "@/features/_shared/course-card.types";

export interface SearchCoursesParams {
  q?: string;
  categoryIds?: number[];
  level?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  sort?: string;
  page?: number;
  limit?: number;
}

export interface CategorySummary {
  id: number;
  name: string;
  courseCount: number;
}

export interface SearchCoursesResult {
  courses: CourseCardData[];
  total: number;
  page: number;
  totalPages: number;
}

export function mapSearchCourseToCardData(item: any): CourseCardData {
  return {
    id: item.id,
    title: item.name ?? "",
    instructorName: item.instructorName ?? null,
    instructorAvatar: item.instructorAvatar ?? null,
    avgRating: item.avgRating ?? null,
    reviewCount: item.reviewCount ?? null,
    enrolledCount: item.enrollCount ?? null,
    price: item.price === 0 ? null : (item.price ?? null),
    category: null, // Search API does not return categories inside the projected fields
    thumbnailUrl: item.thumbnailUrl ?? item.video?.thumbnail ?? null,
    level: item.level ?? null,
  };
}

export const courseSearchApi = {
  getCategories: async (): Promise<CategorySummary[]> => {
    const { data } = await apiHttpClient.get<CategorySummary[]>("/course/categories");
    return data;
  },

  searchCourses: async (params: SearchCoursesParams = {}): Promise<SearchCoursesResult> => {
    const searchParams = new URLSearchParams();

    // Map properties to API request query parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;

      if (key === "categoryIds" && Array.isArray(value)) {
        // Send categoryIds array as multiples of categoryIds, like ?categoryIds=1&categoryIds=2
        value.forEach((val) => {
          if (val !== undefined && val !== null && val !== "") {
            searchParams.append("categoryIds", String(val));
          }
        });
      } else if (key === "level" && value === "all") {
        // Do not add level filter to the request if it is 'all'
        return;
      } else {
        searchParams.set(key, String(value));
      }
    });

    const { data } = await apiHttpClient.get<any>(
      `/course/courses/search?${searchParams.toString()}`
    );

    return {
      courses: (data.data ?? []).map(mapSearchCourseToCardData),
      total: data.total ?? 0,
      page: data.page ?? 1,
      totalPages: data.totalPages ?? 1,
    };
  },
};
