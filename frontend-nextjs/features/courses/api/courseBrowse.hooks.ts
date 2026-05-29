import { useQuery } from "@tanstack/react-query";
import { courseBrowseApi, type BrowseCoursesParams } from "./courseBrowse.api";

export const courseBrowseKeys = {
  root: ["courses", "browse"] as const,
  list: (params: BrowseCoursesParams) => ["courses", "browse", params] as const,
};

export function useBrowseCourses(params: BrowseCoursesParams = {}) {
  return useQuery({
    queryKey: courseBrowseKeys.list(params),
    queryFn: () => courseBrowseApi.getCourses(params),
    staleTime: 2 * 60 * 1000,
  });
}
