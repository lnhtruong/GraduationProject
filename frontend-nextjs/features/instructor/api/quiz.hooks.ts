import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { quizApi } from "./quiz.api";

const QUIZ_KEY = ["instructor", "quizzes"] as const;

export function useInstructorQuizzes() {
  return useQuery({
    queryKey: QUIZ_KEY,
    queryFn: quizApi.getAll,
    staleTime: 2 * 60_000,
  });
}

export function useDeleteQuiz() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => quizApi.deleteQuiz(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUIZ_KEY });
    },
  });
}
