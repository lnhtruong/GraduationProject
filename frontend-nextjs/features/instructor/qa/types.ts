export type DiscussionStatus = "answered" | "unanswered";

export interface DiscussionAuthor {
  id: number;
  name: string;
  avatarUrl: string | null;
}

/** From GET /course/courses/:courseId/discussions — root questions only */
export interface QuestionItem {
  id: number;
  lessonId: number;
  lessonTitle: string;
  content: string;
  upvotes: number;
  replyCount: number;
  createdAt: string;
  author: DiscussionAuthor;
}

/** Reply (child post), from GET /course/lessons/:lessonId/discussions */
export interface DiscussionReply {
  id: number;
  lessonId: number;
  parentId: number;
  content: string;
  isBestAnswer: boolean;
  upvotes: number;
  createdAt: string;
  author: DiscussionAuthor;
}

/** Root post with embedded replies, from GET /course/lessons/:lessonId/discussions */
export interface LessonDiscussionRoot {
  id: number;
  lessonId: number;
  parentId: null;
  content: string;
  upvotes: number;
  createdAt: string;
  author: DiscussionAuthor;
  replies: DiscussionReply[];
}

export interface CourseDiscussionsResponse {
  data: QuestionItem[];
  total: number;
  page: number;
  limit: number;
}

export interface LessonDiscussionsResponse {
  data: LessonDiscussionRoot[];
  total: number;
  page: number;
  limit: number;
}
