export type LessonProgressStatus = "not_started" | "in_progress" | "completed";

export interface InVideoQuizPoint {
  id: string;
  timestamp: number;
  question: string;
  options: string[];
  answerIndex: number | null;
}

export interface AfterLessonQuizQuestion {
  id: string;
  question: string;
  options: string[];
  answerIndex: number | null;
}

export interface ConfettiPiece {
  id: string;
  left: number;
  top: number;
  size: number;
  delay: number;
  duration: number;
  rotate: number;
  drift: number;
  color: string;
}

export interface LessonProgressRecord {
  id: number;
  userId: number;
  courseId: number;
  lessonId: number;
  progress: LessonProgressStatus;
  lastVideoPositionSec?: number;
}

export interface ContinueWatchingLesson {
  lessonProgressId: number;
  courseId: number;
  lessonId: number;
  lessonTitle: string;
  courseTitle: string;
  thumbnailUrl?: string | null;
  lastVideoPositionSec: number;
  updatedAt?: string;
}

export interface UpsertLessonProgressPayload {
  courseId: number;
  lessonId: number;
  progress: LessonProgressStatus;
  lessonProgressId?: number | null;
}
