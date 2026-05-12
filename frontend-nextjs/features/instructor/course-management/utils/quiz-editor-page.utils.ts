import type { InstructorQuiz, QuizEditorState } from "../types";
import {
  createBlankQuizState,
  mapQuizToEditorState,
} from "./quiz-editor.utils";

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
