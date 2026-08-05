import type { InstructorQuiz, QuizEditorState } from "../types";

function byOrderIndexAsc<T extends { orderIndex?: number }>(
  a: T,
  b: T,
): number {
  const left = a.orderIndex ?? Number.MAX_SAFE_INTEGER;
  const right = b.orderIndex ?? Number.MAX_SAFE_INTEGER;
  return left - right;
}

export function createBlankQuizState(
  lessonActivityId: number | null,
  isInVideo = false,
): QuizEditorState {
  return {
    lessonActivityId,
    title: "Quiz mới",
    description: "",
    passingScore: 70,
    timeLimitMinutes: 10,
    shuffleQuestion: false,
    shuffleOption: false,
    isInVideo,
    questions: [
      {
        id: Date.now(),
        prompt: "",
        explanation: "",
        videoTimestamp: "",
        evidenceTimestamp: "",
        options: [
          { id: "a", label: "", isCorrect: true },
          { id: "b", label: "", isCorrect: false },
        ],
      },
    ],
  };
}

export function mapQuizToEditorState(
  quiz: InstructorQuiz,
  lessonActivityId: number,
  description = "",
): QuizEditorState {
  return {
    lessonActivityId,
    title: quiz.name ?? "Quiz mới",
    description,
    passingScore: quiz.passingScore ?? 70,
    timeLimitMinutes: quiz.timeLimitMinutes ?? 10,
    shuffleQuestion: quiz.shuffleQuestion,
    shuffleOption: quiz.shuffleOption,
    isInVideo: quiz.isInVideo,
    questions: [...quiz.questions].sort(byOrderIndexAsc).map((question) => ({
      id: question.id ?? Date.now(),
      prompt: question.quesText,
      explanation: question.explanation ?? "",
      videoTimestamp: question.videoTimestamp ?? "",
      evidenceTimestamp: question.evidenceTimestamp ?? "",
      options: [...(question.options ?? [])]
        .sort(byOrderIndexAsc)
        .map((option, index) => ({
          id: String(option.id ?? `${question.id ?? index}-${index}`),
          label: option.optionText,
          isCorrect: Boolean(option.isCorrect),
        })),
    })),
  };
}
