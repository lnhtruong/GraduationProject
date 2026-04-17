import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { feedbackApi } from "./feedback.api";
import type { CreateFeedbackPayload } from "../types";

export const feedbackKeys = {
  list: (courseId: number, page: number) =>
    ["feedbacks", "list", courseId, page] as const,
  allByCourse: (courseId: number) => ["feedbacks", "list", courseId] as const,
};

export function useFeedbackList(courseId: number, page: number, userId?: number) {
  return useQuery({
    queryKey: feedbackKeys.list(courseId, page),
    queryFn: () => feedbackApi.listByCourse(courseId, page, 5, userId),
    staleTime: 60_000,
  });
}

export function useCreateFeedback(courseId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateFeedbackPayload) => feedbackApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: feedbackKeys.allByCourse(courseId),
      });
    },
  });
}
