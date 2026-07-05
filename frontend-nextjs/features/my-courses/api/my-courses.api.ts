import { useInfiniteQuery } from "@tanstack/react-query";
import { apiHttpClient } from "@/features/_shared/api-factories";
import { EnrollStatus } from "@/features/courses/types";

export interface MyCourseItem {
  id: number;
  courseId: number;
  userId: number;
  progress: number;
  status: EnrollStatus;
  enrolledAt: string;
  completedAt?: string;
  lastLessonId?: number;
  Course?: {
    id: number;
    title?: string;
    name?: string;
    thumbnailUrl: string | null;
    slug?: string;
    user?: {
      firstName: string;
      lastName: string;
    };
  };
  course?: {
    id: number;
    title?: string;
    name?: string;
    thumbnailUrl: string | null;
    slug?: string;
    user?: {
      firstName: string;
      lastName: string;
    };
  };
}

export interface MyCoursesResponse {
  data: MyCourseItem[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

export function useMyCourses() {
  return useInfiniteQuery({
    queryKey: ["my-courses"],
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await apiHttpClient.get<MyCoursesResponse>(
        `/course/enroll`,
        {
          params: {
            page: pageParam,
            limit: 12,
          },
        }
      );
      return data;
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage || !lastPage.pagination) return undefined;
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
    initialPageParam: 1,
  });
}
