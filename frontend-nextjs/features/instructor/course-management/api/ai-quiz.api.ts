import {
  apiHttpClient,
  inferenceHttpClient,
} from "@/features/_shared/api-factories";

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

export interface AiQuizJobStatus {
  jobId?: string;
  job_id?: string;
  status?: string;
  stage?: string;
  type?: string;
  result?: {
    quiz?: unknown;
    error?: string;
    lesson_activity_id?: number;
    lessonActivityId?: number;
    video_id?: number;
    videoId?: number;
  } | null;
  error?: string;
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
  explanation: string | null;
  orderIndex: number;
  videoTimestamp: string | null;
  evidenceTimestamp: string | null;
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

  getJobStatus: async (jobId: string): Promise<AiQuizJobStatus> => {
    const { data } = await inferenceHttpClient.get<AiQuizJobStatus>(
      `/mascot_colab/jobs/status/${encodeURIComponent(jobId)}`,
    );
    return data;
  },

  filterQuestions: async (quizId: number, keepQuestionIds: number[]): Promise<unknown> => {
    const { data } = await apiHttpClient.patch<unknown>(`/course/quizzes/${quizId}/filter-questions`, {
      keepQuestionIds,
    });
    return data;
  },

  deleteQuestion: async (quizId: number, questionId: number): Promise<void> => {
    await apiHttpClient.delete(`/course/quizzes/${quizId}/questions/${questionId}`);
  },

  restoreQuestions: async (quizId: number, restoreQuestionIds: number[]): Promise<unknown> => {
    const { data } = await apiHttpClient.post<unknown>(`/course/quizzes/${quizId}/restore-questions`, {
      questionIds: restoreQuestionIds,
    });
    return data;
  },

  listAllQuestions: async (quizId: number): Promise<AllQuizQuestionsResponse> => {
    const { data } = await apiHttpClient.get<AllQuizQuestionsResponse>(`/course/quizzes/${quizId}/questions/all`);
    return data;
  },
};
