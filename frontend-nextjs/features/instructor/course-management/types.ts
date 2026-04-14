type CourseLevel = "Beginner" | "Intermediate" | "Advanced";

export type CourseStatus =
  | "draft"
  | "pending"
  | "approved"
  | "rejected"
  | "publish";

type LessonContentType = "video" | "text";

type LessonStatus = "active" | "removed" | "blocked";

type LessonActivityStatus = "draft" | "public" | "archived" | "removed";

type LessonActivityType = "quiz" | "assignment";

export type QuizQuestionType = "short_text" | "mcq" | "true/false";

export interface InstructorCourse {
  id: number;
  name: string;
  description: string;
  categories: string[];
  level: CourseLevel;
  duration: string;
  language: string;
  price: number;
  userId: number;
  status: CourseStatus;
  created_at?: string;
  updated_at?: string;
}

export interface InstructorLesson {
  id: number;
  courseId: number;
  videoId?: number | null;
  title: string;
  contentType: LessonContentType;
  content: Record<string, unknown>;
  duration?: number;
  status: LessonStatus;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface InstructorLessonActivity {
  id: number;
  lessonId: number;
  activityType: LessonActivityType;
  title?: string;
  description?: string;
  orderIndex?: number;
  maxAttempts?: number;
  status: LessonActivityStatus;
  createdBy?: number;
}

interface InstructorQuizOption {
  id?: number;
  optionText: string;
  isCorrect?: boolean;
  orderIndex?: number;
}

interface InstructorQuizQuestion {
  id?: number;
  quesType: QuizQuestionType;
  quesText: string;
  point?: number;
  correctAns?: string;
  orderIndex?: number;
  videoTimestamp?: string | null;
  options?: InstructorQuizOption[];
}

export interface InstructorQuiz {
  id: number;
  lessonActivityId: number;
  name: string;
  shuffleQuestion: boolean;
  shuffleOption: boolean;
  passingScore?: number;
  timeLimitMinutes?: number;
  isInVideo: boolean;
  questions: InstructorQuizQuestion[];
}

export interface CourseFormValues {
  name: string;
  description: string;
  categories: string[];
  level: CourseLevel;
  duration: string;
  language: string;
  price: number;
  userId?: number;
  status?: CourseStatus;
}

export interface LessonFormValues {
  courseId: number;
  title: string;
  description: string;
  contentType: LessonContentType;
  duration?: number;
  content: Record<string, unknown>;
  status?: LessonStatus;
  videoId?: number | null;
}

export interface QuizEditorOption {
  id: string;
  label: string;
  isCorrect: boolean;
}

export interface QuizEditorQuestion {
  id: number;
  prompt: string;
  explanation: string;
  videoTimestamp?: string;
  options: QuizEditorOption[];
}

export interface QuizEditorState {
  lessonActivityId: number | null;
  title: string;
  description: string;
  passingScore: number;
  timeLimitMinutes: number;
  shuffleQuestion: boolean;
  shuffleOption: boolean;
  isInVideo: boolean;
  questions: QuizEditorQuestion[];
}
