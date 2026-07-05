import { apiHttpClient } from "@/features/_shared/api-factories";

export interface CreateQuizAIPayload {
  videoId: number;
  lessonActivityId: number;
  name?: string;
  numQuestions?: number;
  difficulty?: "easy" | "medium" | "hard" | "mixed";
  language?: string;
  startTime?: number;
  endTime?: number;
  shuffleQuestion?: boolean;
  shuffleOption?: boolean;
  passingScore?: number;
  timeLimitMinutes?: number;
  isInVideo?: boolean;
}

export interface AiQuizJobResponse {
  jobId: string;
  status: string;
  type: "quiz";
  lessonActivityId: number;
  videoId: number;
  quizName: string;
}

export interface QuizOptionData {
  id: number;
  questionId: number;
  optionText: string;
  isCorrect: boolean;
  orderIndex: number;
}

export interface QuizQuestionData {
  id: number;
  quizId: number;
  quesType: "mcq" | "true/false";
  quesText: string;
  point: number;
  correctAns: string | null;
  orderIndex: number;
  videoTimestamp: string | null;
  options: QuizOptionData[];
}

export interface AllQuizQuestionsResponse {
  active: QuizQuestionData[];
  deleted: QuizQuestionData[];
}

export const aiQuizApi = {
  generate: async (payload: CreateQuizAIPayload): Promise<AiQuizJobResponse> => {
    const { data } = await apiHttpClient.post<AiQuizJobResponse>("/course/quizzes/ai", payload);
    return data;
  },

  filterQuestions: async (quizId: number, keepQuestionIds: number[]): Promise<any> => {
    const { data } = await apiHttpClient.patch<any>(`/course/quizzes/${quizId}/filter-questions`, {
      keepQuestionIds,
    });
    return data;
  },

  deleteQuestion: async (quizId: number, questionId: number): Promise<void> => {
    await apiHttpClient.delete(`/course/quizzes/${quizId}/questions/${questionId}`);
  },

  restoreQuestions: async (quizId: number, restoreQuestionIds: number[]): Promise<any> => {
    const { data } = await apiHttpClient.post<any>(`/course/quizzes/${quizId}/restore-questions`, {
      restoreQuestionIds,
    });
    return data;
  },

  listAllQuestions: async (quizId: number): Promise<AllQuizQuestionsResponse> => {
    const { data } = await apiHttpClient.get<AllQuizQuestionsResponse>(`/course/quizzes/${quizId}/questions/all`);
    return data;
  },
};
