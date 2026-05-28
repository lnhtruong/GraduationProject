import { createApi, apiHttpClient } from "@/features/_shared/api-factories";
import {
  mapCourseRaw,
  extractCourses,
  type CoursesRawResponse,
} from "@/features/_shared/course-mapper";
import type { CourseCardData } from "@/features/_shared/course-card.types";

export const cartSuggestionApi = createApi({
  getSuggestedCourses: async (limit = 6): Promise<CourseCardData[]> => {
    const { data } = await apiHttpClient.get<CoursesRawResponse>("/course/courses", {
      // sort=popular hoạt động khi backend hỗ trợ (README ## API Requirements)
      params: { limit, page: 1, sort: "popular", status: "publish" },
    });

    return extractCourses(data).map(mapCourseRaw);
  },
});
