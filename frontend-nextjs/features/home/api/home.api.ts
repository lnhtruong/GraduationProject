import { createApi, apiHttpClient } from "@/features/_shared/api-factories";
import {
  mapCourseRaw,
  extractCourses,
  type CoursesRawResponse,
} from "@/features/_shared/course-mapper";
import type { CourseCardData } from "@/features/_shared/course-card.types";
import { courseSearchApi } from "@/features/courses/api/courseSearch.api";
import { lessonProgressExtraApi } from "@/features/courses/learn/api/lesson-progress.api";
import { newsfeedApi } from "@/features/newsfeed/api/newsfeed.api";
import type {
  InstructorRoadmap,
} from "@/features/instructor/roadmap-management/types";

export const homeApi = createApi({
  getFeaturedCourses: async (): Promise<CourseCardData[]> => {
    const { data } = await apiHttpClient.get<CoursesRawResponse>("/course/courses", {
      params: { limit: 8, page: 1, status: "publish", sort: "popular" },
    });

    return extractCourses(data).map(mapCourseRaw);
  },

  getPopularCourses: async (): Promise<CourseCardData[]> => {
    const result = await courseSearchApi.searchCourses({
      limit: 8,
      page: 1,
      sort: "popular",
    });
    return result.courses;
  },

  getTopRatedCourses: async (): Promise<CourseCardData[]> => {
    const result = await courseSearchApi.searchCourses({
      limit: 4,
      page: 1,
      sort: "rating",
      minRating: 0,
    });
    return result.courses;
  },

  getCategories: async () => courseSearchApi.getCategories(),

  getTrendingFeed: async () =>
    newsfeedApi.getTrendingFeed({
      limit: 6,
    }),

  getTrendingHashtags: async () =>
    newsfeedApi.getTrendingHashtags({
      days: 14,
      limit: 8,
    }),

  getRoadmaps: async (): Promise<InstructorRoadmap[]> => {
    const { data } = await apiHttpClient.get<
      { data?: InstructorRoadmap[] } | InstructorRoadmap[]
    >("/course/roadmaps", {
      params: { page: 1, limit: 4 },
    });

    return Array.isArray(data) ? data : (data.data ?? []);
  },

  getContinueWatching: async () => lessonProgressExtraApi.getContinueWatching(4),
});
