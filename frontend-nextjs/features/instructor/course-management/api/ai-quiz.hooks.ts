import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { aiQuizApi, CreateQuizAIPayload } from "./ai-quiz.api";

const aiQuizKeys = {
  all: ["ai-quiz"] as const,
  questions: (quizId: number) => [...aiQuizKeys.all, "questions", quizId] as const,
};

export function useGenerateQuizAIMutation() {
  return useMutation({
    mutationFn: (payload: CreateQuizAIPayload) => aiQuizApi.generate(payload),
  });
}

export function useFilterQuizQuestionsMutation(quizId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (keepQuestionIds: number[]) => aiQuizApi.filterQuestions(quizId, keepQuestionIds),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: aiQuizKeys.questions(quizId) });
    },
  });
}

export function useDeleteQuizQuestionMutation(quizId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (questionId: number) => aiQuizApi.deleteQuestion(quizId, questionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: aiQuizKeys.questions(quizId) });
    },
  });
}

export function useRestoreQuizQuestionsMutation(quizId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (restoreQuestionIds: number[]) => aiQuizApi.restoreQuestions(quizId, restoreQuestionIds),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: aiQuizKeys.questions(quizId) });
    },
  });
}

export function useAllQuizQuestionsQuery(quizId: number, enabled = true) {
  return useQuery({
    queryKey: aiQuizKeys.questions(quizId),
    queryFn: () => aiQuizApi.listAllQuestions(quizId),
    enabled: enabled && Number.isInteger(quizId) && quizId > 0,
    staleTime: 5000,
  });
}
