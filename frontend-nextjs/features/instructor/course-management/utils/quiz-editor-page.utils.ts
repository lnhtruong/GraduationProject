import type {
  InstructorLessonActivity,
  InstructorQuiz,
  QuizEditorState,
} from "../types";
import {
  createBlankQuizState,
  mapQuizToEditorState,
} from "./quiz-editor.utils";

export function resolveQuizActivity(
  lessonActivities: InstructorLessonActivity[] | undefined,
  initialActivityId: number | null,
) {
  return (
    (initialActivityId
      ? lessonActivities?.find((activity) => activity.id === initialActivityId)
      : null) ??
    lessonActivities?.find((activity) => activity.activityType === "quiz") ??
    null
  );
}

export function resolveExistingQuiz(
  initialQuizId: number | null,
  quizById: InstructorQuiz | undefined,
  quizzes: InstructorQuiz[] | undefined,
) {
  return (initialQuizId ? quizById : undefined) || quizzes?.[0] || null;
}

export function buildQuizEditorState(
  existingQuiz: InstructorQuiz | null,
  quizActivityId: number | null,
  quizActivityDescription: string,
  initialIsInVideo: boolean,
): QuizEditorState {
  return existingQuiz
    ? mapQuizToEditorState(
        existingQuiz,
        quizActivityId ?? existingQuiz.lessonActivityId,
        quizActivityDescription,
      )
    : createBlankQuizState(quizActivityId ?? null, initialIsInVideo);
}

export function buildQuizEditorKey(
  quizActivityId: number | null,
  existingQuizId: number | null,
) {
  return `${quizActivityId ?? "new"}-${existingQuizId ?? "new"}`;
}
