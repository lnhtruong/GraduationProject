import { useMemo } from "react";
import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";
import { createKeyFactory } from "@/lib/queryKeys";
import { quizSubmissionApi } from "./quiz-submissions.api";
import type { QuizSubmissionRecord, SubmitQuizPayload } from "../types";

const quizSubmissionKeys = createKeyFactory("quiz-submissions");

export function useQuizSubmissionsByQuizIds(quizIds: number[], enabled = true) {
  const uniqueQuizIds = useMemo(
    () => [...new Set(quizIds.filter((quizId) => Number.isFinite(quizId)))],
    [quizIds],
  );

  return useQueries({
    queries: uniqueQuizIds.map((quizId) => ({
      queryKey: quizSubmissionKeys.custom("mine", quizId),
      queryFn: () => quizSubmissionApi.listMine(quizId),
      enabled: enabled && uniqueQuizIds.length > 0,
      staleTime: 30 * 1000,
    })),
  });
}

export function useSubmitQuizSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SubmitQuizPayload) =>
      quizSubmissionApi.submit(payload),
    onSuccess: (savedSubmission, payload) => {
      queryClient.setQueryData<QuizSubmissionRecord[]>(
        quizSubmissionKeys.custom("mine", payload.quizId),
        (current) => {
          const next = [savedSubmission, ...(current ?? [])].filter(
            (record, index, rows) =>
              rows.findIndex((item) => item.id === record.id) === index,
          );
          return next.sort((left, right) => right.id - left.id);
        },
      );

      queryClient.invalidateQueries({
        queryKey: quizSubmissionKeys.custom("mine", payload.quizId),
      });
    },
  });
}
