import type { InstructorLessonActivity, InstructorQuiz } from "../types";

export interface QuizTimelineMarkerItem {
  quizId: number;
  lessonActivityId: number;
  questionIds: number[];
  questionId?: number;
  questionCount: number;
  quizName: string;
  questionText: string;
}

export interface QuizTimelineMarker extends QuizTimelineMarkerItem {
  timestamp?: string;
  timestampLabel: string;
  timestampSeconds: number;
  quizCount?: number;
  items?: QuizTimelineMarkerItem[];
}

export function parseVideoTimestampToSeconds(
  timestamp?: string | null,
): number | null {
  if (!timestamp) {
    return null;
  }

  const normalized = timestamp.trim().replace(",", ".");
  const match = normalized.match(/^(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?$/);
  if (!match) {
    return null;
  }

  const [, hh, mm, ss, ms = "0"] = match;
  const hours = Number(hh);
  const minutes = Number(mm);
  const seconds = Number(ss);
  const millis = Number(ms.padEnd(3, "0"));

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    Number.isNaN(seconds) ||
    Number.isNaN(millis)
  ) {
    return null;
  }

  return hours * 3600 + minutes * 60 + seconds + millis / 1000;
}

export function formatSecondsToTimestampLabel(value: number): string {
  const safe = Math.max(0, Math.floor(value));
  const hh = Math.floor(safe / 3600);
  const mm = Math.floor((safe % 3600) / 60);
  const ss = safe % 60;

  if (hh > 0) {
    return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  }

  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

export function buildQuizTimelineMarkers(
  quizzes: InstructorQuiz[] | null | undefined,
  activities: InstructorLessonActivity[] | null | undefined,
): QuizTimelineMarker[] {
  const activityTitleMap = new Map<number, string>();
  const pendingActivityIds = new Set<number>();
  (activities ?? []).forEach((activity) => {
    if (activity.title?.trim()) {
      activityTitleMap.set(activity.id, activity.title.trim());
    }
    if (activity.description === "AI_REVIEW_PENDING") {
      pendingActivityIds.add(activity.id);
    }
  });

  const markers: QuizTimelineMarker[] = [];

  (quizzes ?? []).forEach((quiz) => {
    if (pendingActivityIds.has(quiz.lessonActivityId)) {
      return;
    }
    quiz.questions.forEach((question) => {
      const seconds = parseVideoTimestampToSeconds(question.videoTimestamp);
      if (seconds === null) {
        return;
      }

      markers.push({
        quizId: quiz.id,
        lessonActivityId: quiz.lessonActivityId,
        questionIds: typeof question.id === "number" ? [question.id] : [],
        questionId: question.id,
        questionCount: 1,
        quizName:
          activityTitleMap.get(quiz.lessonActivityId) ??
          quiz.name ??
          "Trắc nghiệm chưa đặt tên",
        questionText: question.quesText,
        timestampLabel: formatSecondsToTimestampLabel(seconds),
        timestampSeconds: seconds,
      });
    });
  });

  return markers.sort((a, b) => a.timestampSeconds - b.timestampSeconds);
}
