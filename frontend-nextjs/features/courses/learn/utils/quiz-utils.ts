import type {
  InstructorLesson,
  InstructorQuiz,
} from "../../../instructor/course-management/types";
import type { AfterLessonQuizQuestion, InVideoQuizPoint } from "../types";

export function makeQuizPointId(quizId: number, questionId: number): string {
  return `${quizId}-${questionId}`;
}

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

export function parseVideoTimestampToSeconds(value?: string | null): number | null {
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

      const questionId = question.id;
      if (questionId === undefined || questionId === null) {
        continue;
      }

      const optionIds = (question.options ?? [])
        .map((option: { id?: number }) => option.id)
        .filter((optionId): optionId is number => typeof optionId === "number");
      const options = (question.options ?? [])
        .map((option: { optionText?: string | null }) => option.optionText)
        .filter(Boolean) as string[];

      points.push({
        id: makeQuizPointId(quiz.id, questionId),
        quizId: quiz.id,
        questionId,
        timestamp,
        question: question.quesText,
        options,
        optionIds,
        answerIndex: null,
      });
    }
  }

  return points.sort((left, right) => left.timestamp - right.timestamp);
}

export interface InVideoQuizPointGroup {
  timestamp: number;
  points: InVideoQuizPoint[];
}

/**
 * Gom các câu hỏi cùng chung 1 mốc video (AI-quiz dùng chung 1 timestamp cho
 * cả quiz) thành từng nhóm, để timeline chỉ hiển thị 1 marker/nhóm thay vì
 * chồng nhiều marker lên đúng 1 vị trí.
 */
export function groupInVideoQuizPointsByTimestamp(
  points: InVideoQuizPoint[],
): InVideoQuizPointGroup[] {
  const groups = new Map<number, InVideoQuizPoint[]>();

  for (const point of points) {
    const existing = groups.get(point.timestamp);
    if (existing) {
      existing.push(point);
    } else {
      groups.set(point.timestamp, [point]);
    }
  }

  return Array.from(groups.entries())
    .map(([timestamp, groupPoints]) => ({ timestamp, points: groupPoints }))
    .sort((left, right) => left.timestamp - right.timestamp);
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
        options?: Array<{ id?: number; optionText?: string | null }>;
      },
      index: number,
    ) => ({
      id: makeQuizPointId(firstQuiz.id, Number(question.id ?? index + 1)),
      quizId: firstQuiz.id,
      questionId: Number(question.id ?? index + 1),
      question: question.quesText,
      options: (question.options ?? [])
        .map((option: { optionText?: string | null }) => option.optionText)
        .filter(Boolean) as string[],
      optionIds: (question.options ?? [])
        .map((option: { id?: number }) => option.id)
        .filter((optionId): optionId is number => typeof optionId === "number"),
      answerIndex: null,
      passingScore: firstQuiz.passingScore ?? 70,
    }),
  );
}
