import type {
  InstructorLesson,
  InstructorQuiz,
} from "../../../instructor/course-management/types";
import type { AfterLessonQuizQuestion, InVideoQuizPoint } from "../types";

export function resolveInitialLessonId(
  lessons: InstructorLesson[],
  rawLessonParam: string | null,
  preferredLessonId?: number | null,
): number {
  const fallback =
    preferredLessonId !== null &&
    preferredLessonId !== undefined &&
    lessons.some((lesson) => lesson.id === preferredLessonId)
      ? preferredLessonId
      : (lessons[0]?.id ?? 0);
  const parsed = Number(rawLessonParam);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return lessons.some((lesson) => lesson.id === parsed) ? parsed : fallback;
}

function parseVideoTimestampToSeconds(value?: string | null): number | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim().replace(",", ".");
  const match = normalized.match(/^(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?$/);
  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(match[3]);
  const millis = Number((match[4] ?? "0").padEnd(3, "0"));

  return hours * 3600 + minutes * 60 + seconds + millis / 1000;
}

function resolveQuestionAnswerIndex(quizQuestion: {
  options?: Array<{ isCorrect?: boolean | null; optionText?: string | null }>;
  correctAns?: string | null;
}): number | null {
  const options = quizQuestion.options ?? [];
  const byFlag = options.findIndex((option: { isCorrect?: boolean | null }) =>
    Boolean(option.isCorrect),
  );
  if (byFlag >= 0) {
    return byFlag;
  }

  const correctAns = quizQuestion.correctAns?.trim().toLowerCase();
  if (!correctAns) {
    return null;
  }

  const byLabel = options.findIndex(
    (option: { optionText?: string | null }) =>
      option.optionText?.trim().toLowerCase() === correctAns,
  );

  return byLabel >= 0 ? byLabel : null;
}

export function buildInVideoQuizPoints(
  quizzes: InstructorQuiz[] | undefined,
): InVideoQuizPoint[] {
  const points: InVideoQuizPoint[] = [];

  for (const quiz of quizzes ?? []) {
    for (
      let questionIndex = 0;
      questionIndex < quiz.questions.length;
      questionIndex += 1
    ) {
      const question = quiz.questions[questionIndex];
      const timestamp = parseVideoTimestampToSeconds(question.videoTimestamp);
      if (timestamp === null) {
        continue;
      }

      const options = (question.options ?? [])
        .map((option: { optionText?: string | null }) => option.optionText)
        .filter(Boolean) as string[];

      points.push({
        id: `${quiz.id}-${question.id ?? questionIndex}`,
        timestamp,
        question: question.quesText,
        options,
        answerIndex: resolveQuestionAnswerIndex(question),
      });
    }
  }

  return points.sort((left, right) => left.timestamp - right.timestamp);
}

export function buildAfterLessonQuiz(
  quizzes: InstructorQuiz[] | undefined,
): AfterLessonQuizQuestion[] {
  const firstQuiz = quizzes?.[0];
  if (!firstQuiz) {
    return [];
  }

  return firstQuiz.questions.map(
    (
      question: {
        id?: number | string | null;
        quesText: string;
        options?: Array<{ optionText?: string | null }>;
        correctAns?: string | null;
      },
      index: number,
    ) => ({
      id: `${firstQuiz.id}-${question.id ?? index}`,
      question: question.quesText,
      options: (question.options ?? [])
        .map((option: { optionText?: string | null }) => option.optionText)
        .filter(Boolean) as string[],
      answerIndex: resolveQuestionAnswerIndex(question),
    }),
  );
}
