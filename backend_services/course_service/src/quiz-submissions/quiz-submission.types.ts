import { Course } from 'src/models/course.model';
import { LessonActivity } from 'src/models/lesson-activity.model';
import { Lesson } from 'src/models/lesson.model';
import { Quiz } from 'src/models/quiz.model';

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
}

export interface QuizSubmissionContext {
  quiz: Quiz;
  activity: LessonActivity;
  lesson: Lesson;
  course: Course;
}

export type QuizStatsAttemptPolicy = 'ALL_ATTEMPTS';

export interface QuizSubmissionStats {
  totalSubmissions: number; // tổng số lượt nộp - tính từ tổng lượt nộp của tất cả user trong app
  totalUsersAttempted: number; // số lượng user khác nhau đã attempt submit cái quiz này
  avgPercent: number | null; // trung bình điểm - tính toàn bộ user
  highestPercent: number | null; // điểm cao nhất có người đã đạt được
  lowestPercent: number | null; // điểm thấp nhất có người đã đạt được
  passedCount: number; // số lượng user đã pass qua quiz này
  failedCount: number; // số lượng user chưa pass
  passRate: number | null; // tỉ lệ pass quiz
  avgTimeSeconds: number | null; // thời gian làm bài trung bình, tính bằng giây
  attemptPolicy: QuizStatsAttemptPolicy; // stats lấy toàn bộ lượt nộp của user -> tính trung bình; để phát triển về sau thì sẽ có thêm BEST_ATTEMPT -> lấy lần nộp tốt nhất của user hoặc LAST_ATTEMPT -> chỉ lấy lần nộp cuối
  maxAttempts: number | null; // số lần làm tối đa của quiz này
}
