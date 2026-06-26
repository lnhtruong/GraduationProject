import { createApi, apiHttpClient } from "@/features/_shared/api-factories";
import {
  mapCourseRaw,
  extractCourses,
  type CoursesRawResponse,
} from "@/features/_shared/course-mapper";
import type { CourseCardData } from "@/features/_shared/course-card.types";

export const homeApi = createApi({
  getFeaturedCourses: async (): Promise<CourseCardData[]> => {
    const { data } = await apiHttpClient.get<CoursesRawResponse>("/course/courses", {
      params: { limit: 8, page: 1, status: 'publish' },
    });

    return extractCourses(data).map(mapCourseRaw);
  },
});
