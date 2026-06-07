import { useQuery } from "@tanstack/react-query";
import { courseSearchApi, type SearchCoursesParams } from "./courseSearch.api";

export const courseSearchKeys = {
  all: ["courses", "search"] as const,
  list: (params: SearchCoursesParams) => ["courses", "search", "list", params] as const,
  categories: ["courses", "search", "categories"] as const,
};

export function useSearchCourses(params: SearchCoursesParams = {}) {
  return useQuery({
    queryKey: courseSearchKeys.list(params),
    queryFn: () => courseSearchApi.searchCourses(params),
    staleTime: 10 * 1000, // Keep staleTime short since we are dynamically filtering
  });
}

export function useCourseCategories() {
  return useQuery({
    queryKey: courseSearchKeys.categories,
    queryFn: () => courseSearchApi.getCategories(),
    staleTime: 5 * 60 * 1000, // Categories don't change often
  });
}
