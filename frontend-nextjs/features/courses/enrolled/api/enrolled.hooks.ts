import { useQuery } from "@tanstack/react-query";
import { createKeyFactory } from "@/lib/queryKeys";
import { enrolledApi } from "./enrolled.api";

const enrolledKeys = createKeyFactory("enrolled-courses");

export function useEnrolledCourses(enabled = true) {
  return useQuery({
    queryKey: enrolledKeys.list(),
    queryFn: () => enrolledApi.list(),
    enabled,
    staleTime: 60 * 1000,
  });
}
