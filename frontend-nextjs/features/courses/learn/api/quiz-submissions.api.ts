import { apiHttpClient } from "@/features/_shared/api-factories";
import type {
  QuizSubmissionAnswerSnapshot,
  QuizSubmissionRecord,
  SubmitQuizPayload,
} from "../types";

type QuizSubmissionAnswerApiResponse = Partial<QuizSubmissionAnswerSnapshot> & {
  question_id?: number;
  question_text?: string;
  selected_option_id?: number;
  selected_option_text?: string;
  correct_option_id?: number | null;
  correct_option_text?: string | null;
  is_correct?: boolean;
  max_point?: number;
};

type QuizSubmissionApiResponse = Partial<QuizSubmissionRecord> & {
  quiz_id?: number;
  user_id?: number;
  max_score?: number | null;
  time_spent_seconds?: number | null;
  created_at?: string;
  updated_at?: string;
  answers?: QuizSubmissionAnswerApiResponse[];
};

function mapQuizSubmissionAnswer(
  raw: QuizSubmissionAnswerApiResponse,
): QuizSubmissionAnswerSnapshot {
  return {
    questionId: Number(raw.questionId ?? raw.question_id ?? 0),
    questionText: String(raw.questionText ?? raw.question_text ?? ""),
    selectedOptionId: Number(
      raw.selectedOptionId ?? raw.selected_option_id ?? 0,
    ),
    selectedOptionText: String(
      raw.selectedOptionText ?? raw.selected_option_text ?? "",
    ),
    correctOptionId: raw.correctOptionId ?? raw.correct_option_id ?? null,
    correctOptionText: raw.correctOptionText ?? raw.correct_option_text ?? null,
    isCorrect: Boolean(raw.isCorrect ?? raw.is_correct ?? false),
    point: Number(raw.point ?? 0),
    maxPoint: Number(raw.maxPoint ?? raw.max_point ?? 0),
  };
}

function mapQuizSubmission(
  raw: QuizSubmissionApiResponse,
): QuizSubmissionRecord {
  return {
    id: Number(raw.id ?? 0),
    quizId: Number(raw.quizId ?? raw.quiz_id ?? 0),
    userId: Number(raw.userId ?? raw.user_id ?? 0),
    score: raw.score ?? null,
    maxScore: raw.maxScore ?? raw.max_score ?? null,
    percent: raw.percent ?? null,
    passed: Boolean(raw.passed ?? false),
    timeSpentSeconds: raw.timeSpentSeconds ?? raw.time_spent_seconds ?? null,
    answers: Array.isArray(raw.answers)
      ? raw.answers.map(mapQuizSubmissionAnswer)
      : [],
    createdAt: raw.createdAt ?? raw.created_at,
    updatedAt: raw.updatedAt ?? raw.updated_at,
  };
}

export const quizSubmissionApi = {
  listMine: async (quizId: number): Promise<QuizSubmissionRecord[]> => {
    const { data } = await apiHttpClient.get<QuizSubmissionApiResponse[]>(
      "/course/quiz-submissions/mine",
      {
        params: { quizId },
      },
    );

    return (Array.isArray(data) ? data : []).map(mapQuizSubmission);
  },
  submit: async (payload: SubmitQuizPayload): Promise<QuizSubmissionRecord> => {
    const { data } = await apiHttpClient.post<QuizSubmissionApiResponse>(
      "/course/quiz-submissions",
      payload,
    );

    return mapQuizSubmission(data);
  },
};
