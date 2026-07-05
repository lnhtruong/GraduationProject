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
  categories: CategorySummary[];
  total: number;
  page: number;
  totalPages: number;
}

interface SearchCourseApiItem {
  id: number;
  name?: string | null;
  instructorName?: string | null;
  instructorAvatar?: string | null;
  avgRating?: number | string | null;
  reviewCount?: number | string | null;
  enrollCount?: number | string | null;
  price?: number | null;
  categories?: unknown;
  thumbnailUrl?: string | null;
  video?: {
    thumbnail?: string | null;
  } | null;
  level?: string | null;
}

interface SearchCoursesApiResponse {
  data?: SearchCourseApiItem[];
  categories?: CategorySummary[];
  total?: number;
  page?: number;
  totalPages?: number;
}

function normalizeCategories(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  }

  if (typeof value === "string" && value.trim().length > 0) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed)
        ? parsed.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
        : [value];
    } catch {
      return [value];
    }
  }

  return [];
}

function toNullableNumber(value: number | string | null | undefined): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function mapSearchCourseToCardData(item: SearchCourseApiItem): CourseCardData {
  const categories = normalizeCategories(item.categories);
  const price = toNullableNumber(item.price);

  return {
    id: item.id,
    title: item.name ?? "",
    instructorName: item.instructorName ?? null,
    instructorAvatar: item.instructorAvatar ?? null,
    avgRating: toNullableNumber(item.avgRating),
    reviewCount: toNullableNumber(item.reviewCount),
    enrolledCount: toNullableNumber(item.enrollCount),
    price: price === 0 ? null : price,
    category: categories[0] ?? null,
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

    const { data } = await apiHttpClient.get<SearchCoursesApiResponse>(
      `/course/courses/search?${searchParams.toString()}`
    );

    return {
      courses: (data.data ?? []).map(mapSearchCourseToCardData),
      categories: Array.isArray(data.categories) ? data.categories : [],
      total: data.total ?? 0,
      page: data.page ?? 1,
      totalPages: data.totalPages ?? 1,
    };
  },
};
