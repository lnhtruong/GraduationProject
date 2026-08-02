export type LessonProgressStatus = "not_started" | "in_progress" | "completed";

export interface QuizSubmissionAnswerSnapshot {
  questionId: number;
  questionText: string;
  selectedOptionId: number;
  selectedOptionText: string;
  correctOptionId: number | null;
  correctOptionText: string | null;
  isCorrect: boolean;
  point: number;
  maxPoint: number;
  explanation: string | null;
  evidenceTimestamp: string | null;
}

export interface QuizSubmissionRecord {
  id: number;
  quizId: number;
  userId: number;
  score: number | null;
  maxScore: number | null;
  percent: number | null;
  passed: boolean;
  timeSpentSeconds: number | null;
  answers: QuizSubmissionAnswerSnapshot[];
  createdAt?: string;
  updatedAt?: string;
}

export interface SubmitQuizAnswerPayload {
  questionId: number;
  selectedOptionId: number;
}

export interface SubmitQuizPayload {
  quizId: number;
  answers: SubmitQuizAnswerPayload[];
  timeSpentSeconds?: number;
}

export interface InVideoQuizPoint {
  id: string;
  quizId: number;
  questionId: number;
  timestamp: number;
  question: string;
  options: string[];
  optionIds: number[];
  answerIndex: number | null;
}

export interface AfterLessonQuizQuestion {
  id: string;
  quizId: number;
  questionId: number;
  question: string;
  options: string[];
  optionIds: number[];
  answerIndex: number | null;
  passingScore?: number;
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
  /** Last watched video position, in milliseconds. */
  lastVideoPositionMs?: number;
  lastWatchedAt?: string;
}

export interface ContinueWatchingLesson {
  lessonProgressId: number;
  courseId: number;
  lessonId: number;
  lessonTitle: string;
  courseTitle: string;
  thumbnailUrl?: string | null;
  /** Last watched video position, in milliseconds. */
  lastVideoPositionMs: number;
  percentage: number;
  updatedAt?: string;
}

export interface UpsertLessonProgressPayload {
  courseId: number;
  lessonId: number;
  progress: LessonProgressStatus;
  lessonProgressId?: number | null;
}

export interface DiscussionAuthorSnapshot {
  id: number;
  name: string;
  avatarUrl: string | null;
}

export interface DiscussionPostRecord {
  id: number;
  lessonId: number;
  parentId: number | null;
  parentRootId?: number | null;
  content: string;
  isBestAnswer: boolean;
  upvotes: number;
  voted?: boolean;
  createdAt: string;
  updatedAt: string;
  author: DiscussionAuthorSnapshot;
  replies?: DiscussionPostRecord[];
}

export interface DiscussionListResponse {
  data: DiscussionPostRecord[];
  total: number;
  page: number;
  limit: number;
}
