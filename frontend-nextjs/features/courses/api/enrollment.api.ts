import { useQuery } from "@tanstack/react-query";
import { apiHttpClient } from "@/features/_shared/api-factories";
import type { Enrollment } from "../types";

interface CheckEnrollResponse {
  check: boolean;
  data: (Enrollment & { courseId: number }) | null;
}

export function useEnrollmentCheck(courseId: number, userId?: number) {
  return useQuery({
    queryKey: ["enrollment", "check", courseId, userId],
    queryFn: async () => {
      const { data } = await apiHttpClient.get<CheckEnrollResponse>(
        `/course/enroll/check-mine-exists?userId=${userId}&courseId=${courseId}`
      );
      return data.check ? data.data : null;
    },
    enabled: !!userId && !!courseId,
    staleTime: 5 * 60_000,
  });
}
