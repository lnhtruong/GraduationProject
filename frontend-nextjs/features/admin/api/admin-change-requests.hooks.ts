import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminChangeRequestsApi } from "./admin-change-requests.api";
import type {
  ChangeRequestListParams,
  ReviewChangeRequestDto,
} from "../types/change-request.types";

const KEYS = {
  all: ["admin", "change-requests"] as const,
  list: (params?: ChangeRequestListParams) =>
    ["admin", "change-requests", "list", params] as const,
};

export function useAdminChangeRequests(params?: ChangeRequestListParams) {
  return useQuery({
    queryKey: KEYS.list(params),
    queryFn: () => adminChangeRequestsApi.listAll(params),
    staleTime: 30_000,
  });
}

export function useReviewChangeRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, dto }: { requestId: number; dto: ReviewChangeRequestDto }) =>
      adminChangeRequestsApi.review(requestId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.all });
    },
  });
}
