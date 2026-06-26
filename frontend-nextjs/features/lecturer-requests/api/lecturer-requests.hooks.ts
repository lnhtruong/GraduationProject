import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  studentLecturerRequestApi,
  adminLecturerRequestApi,
} from "./lecturer-requests.api";
import type {
  LecturerRequestListParams,
  ReviewLecturerRequestDto,
} from "../types/lecturer-request.types";

export const LECTURER_REQUEST_KEYS = {
  all: ["lecturer-requests"] as const,
  mine: (params?: LecturerRequestListParams) =>
    ["lecturer-requests", "mine", params] as const,
  adminList: (params?: LecturerRequestListParams) =>
    ["lecturer-requests", "admin-list", params] as const,
  detail: (id: number) => ["lecturer-requests", "detail", id] as const,
};

export function useMyLecturerRequests(
  params?: LecturerRequestListParams,
  enabled = true,
) {
  return useQuery({
    queryKey: LECTURER_REQUEST_KEYS.mine(params),
    queryFn: () => studentLecturerRequestApi.listMine(params),
    enabled,
    staleTime: 30_000,
  });
}

export function useCreateLecturerRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: studentLecturerRequestApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LECTURER_REQUEST_KEYS.all });
    },
  });
}

export function useAdminLecturerRequests(params?: LecturerRequestListParams) {
  return useQuery({
    queryKey: LECTURER_REQUEST_KEYS.adminList(params),
    queryFn: () => adminLecturerRequestApi.listAll(params),
    staleTime: 30_000,
  });
}

export function useReviewLecturerRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      dto,
    }: {
      id: number;
      dto: ReviewLecturerRequestDto;
    }) => adminLecturerRequestApi.review(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LECTURER_REQUEST_KEYS.all });
    },
  });
}
