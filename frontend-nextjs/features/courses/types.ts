export type CourseLevel = "Beginner" | "Intermediate" | "Advanced";
export type LessonContentType = "video" | "text" | "quiz" | "assignment";
export type EnrollStatus = "active" | "completed" | "dropped";

export interface CourseCategory {
  id: number;
  name: string;
}

export interface CourseInstructor {
  id: number;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  bio?: string;
  /** e.g. "Senior Software Engineer" */
  title?: string;
  totalStudents?: number;
  totalCourses?: number;
  avgRating?: number;
}

export interface Lesson {
  id: number;
  title: string;
  contentType: LessonContentType;
  /** duration in seconds */
  duration: number;
  order: number;
  /** free preview lesson */
  isFree: boolean;
}


export interface Review {
  id: number;
  userId: number;
  rating: number;
  comment: string;
  createdAt: string;
  user?: {
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
}

export interface RatingSummary {
  average: number;
  total: number;
  breakdown: { 5: number; 4: number; 3: number; 2: number; 1: number };
}

export interface Enrollment {
  id: number;
  courseId: number;
  /** 0–100 */
  progress: number;
  status: EnrollStatus;
  enrolledAt?: string;
  /** ID of the last lesson accessed — used for "Continue Learning" */
  lastLessonId?: number;
}

export type FeedbackReactionType = "help_ful" | "dislike";

export interface ReactionSummary {
  feedbackId: number;
  total: number;
  helpfulCount?: number;
  byType: { reactionType: FeedbackReactionType; count: number }[];
  currentUserReactionType?: FeedbackReactionType | null;
}

export interface FeedbackItem {
  id: number;
  courseId: number;
  userId: number;
  rating: number;
  reviewText: string;
  isVisible: boolean;
  created_at: string;
  updated_at: string;
  user: { id: number; firstName: string; lastName: string };
  reactionSummary?: ReactionSummary;
}

export interface CheckFeedbackResponse {
  checked: boolean;
  data: (FeedbackItem & { reactionSummary: ReactionSummary }) | null;
}

export interface FeedbackSummary {
  averageRating: number;
  totalReviews: number;
  distribution: { rating: number; count: number; percentage: number }[];
}

export interface FeedbackListResponse {
  summary: FeedbackSummary;
  items: FeedbackItem[];
  pagination: { page: number; limit: number; totalItems: number; totalPages: number };
}

export interface CreateFeedbackPayload {
  courseId: number;
  rating: number;
  reviewText: string;
}

export interface CourseDetail {
  id: number;
  name: string;
  /** ≤300 chars — used in hero subtitle */
  shortDescription: string;
  description: string;
  thumbnailUrl?: string;
  previewVideoUrl?: string;
  /** AI-generated highlight clip shown on card hover */
  highlightClipUrl?: string;
  whatYouLearn: string[];
  requirements: string[];
  categories: CourseCategory[];
  level: CourseLevel;
  /** total duration in seconds */
  duration: number;
  language: string;
  /** 0 = free */
  price: number;
  originalPrice?: number;
  /** ISO datetime string; show countdown when set */
  discountEndAt?: string;
  hasCertificate: boolean;
  instructor: CourseInstructor;
  lessons: Lesson[];
  ratingSummary: RatingSummary;
  reviews: Review[];
  totalLessons: number;
  totalStudents: number;
  lastUpdatedAt: string;
  createdAt: string;
}

// Instructor/CMS API contract types
export type CourseStatus =
  | "draft"
  | "pending"
  | "approved"
  | "rejected"
  | "publish";

export type CourseReviewAction = "accepted" | "rejected";

export interface Course {
  id: number;
  name: string;
  description: string;
  categories: string[];
  level: CourseLevel;
  duration?: string;
  language: string;
  price: number;
  userId: number;
  status: CourseStatus;
  created_at?: string;
  updated_at?: string;
}

export interface CreateCoursePayload {
  name: string;
  description?: string;
  categories: string[];
  level?: CourseLevel;
  language: string;
  price: number;
}

export type UpdateCoursePayload = Partial<CreateCoursePayload>;

export type CourseListParams = {
  userId?: number;
  status?: CourseStatus;
  page?: number;
  limit?: number;
};
