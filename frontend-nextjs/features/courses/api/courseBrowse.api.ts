import { createApi, apiHttpClient } from "@/features/_shared/api-factories";
import {
  mapCourseRaw,
  extractCourses,
  type CoursesRawResponse,
} from "@/features/_shared/course-mapper";
import type { CourseCardData } from "@/features/_shared/course-card.types";

export type CourseSort = "newest" | "popular" | "rating";

export interface BrowseCoursesParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: CourseSort;
}

export interface BrowseCoursesResult {
  courses: CourseCardData[];
  totalPages: number;
  totalItems: number;
}

export const courseBrowseApi = createApi({
  getCourses: async (params: BrowseCoursesParams = {}): Promise<BrowseCoursesResult> => {
    const query: Record<string, string | number> = {
      page: params.page ?? 1,
      limit: params.limit ?? 12,
      status: "publish",
    };
    if (params.search?.trim()) query.search = params.search.trim();
    if (params.sort) query.sort = params.sort;

    const { data } = await apiHttpClient.get<CoursesRawResponse>("/course/courses", {
      params: query,
    });

    // Khi BE trả về paginated object (có pagination field)
    if (!Array.isArray(data) && "pagination" in data && data.pagination) {
      const p = data.pagination as { totalPages?: number; totalItems?: number };
      return {
        courses: extractCourses(data).map(mapCourseRaw),
        totalPages: p.totalPages ?? 1,
        totalItems: p.totalItems ?? 0,
      };
    }

    // Fallback: BE trả về array thuần (không có pagination)
    const courses = extractCourses(data).map(mapCourseRaw);
    return { courses, totalPages: 1, totalItems: courses.length };
  },
});
