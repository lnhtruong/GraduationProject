import { useQuery } from "@tanstack/react-query";
import { apiHttpClient } from "@/features/_shared/api-factories";
import type { Enrollment } from "../types";

interface EnrollListResponse {
  items: (Enrollment & { courseId: number })[];
}

export function useEnrollmentCheck(courseId: number, userId?: number) {
  return useQuery({
    queryKey: ["enrollment", "check", courseId, userId],
    queryFn: async () => {
      const { data } = await apiHttpClient.get<EnrollListResponse>("/course/enroll");
      return data.items.find((e) => e.courseId === courseId) ?? null;
    },
    enabled: !!userId,
    staleTime: 5 * 60_000,
  });
}
