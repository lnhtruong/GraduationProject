import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { feedbackApi } from "./feedback.api";
import type { CreateFeedbackPayload, FeedbackReactionType } from "../types";

export const feedbackKeys = {
  list: (courseId: number, page: number) =>
    ["feedbacks", "list", courseId, page] as const,
  allByCourse: (courseId: number) => ["feedbacks", "list", courseId] as const,
  check: (courseId: number) => ["feedbacks", "check", courseId] as const,
};

export function useFeedbackList(courseId: number, page: number, userId?: number) {
  return useQuery({
    queryKey: feedbackKeys.list(courseId, page),
    queryFn: () => feedbackApi.listByCourse(courseId, page, 5, userId),
    staleTime: 60_000,
  });
}

export function useCheckUserReview(courseId: number, enabled = true) {
  return useQuery({
    queryKey: feedbackKeys.check(courseId),
    queryFn: () => feedbackApi.checkUserReview(courseId),
    staleTime: 60_000,
    enabled,
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
      queryClient.invalidateQueries({
        queryKey: feedbackKeys.check(courseId),
      });
    },
  });
}

export function useToggleReaction(courseId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      feedbackId,
      reactionType,
      currentReaction,
    }: {
      feedbackId: number;
      reactionType: FeedbackReactionType;
      currentReaction: FeedbackReactionType | null | undefined;
    }) => {
      if (currentReaction === reactionType) {
        return feedbackApi.removeReaction(feedbackId);
      }
      return feedbackApi.toggleReaction(feedbackId, reactionType);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: feedbackKeys.allByCourse(courseId),
      });
      queryClient.invalidateQueries({
        queryKey: feedbackKeys.check(courseId),
      });
    },
  });
}
