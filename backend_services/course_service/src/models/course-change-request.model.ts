import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { Course, CourseLevel } from './course.model';
import { ContentType, LessonStatus } from './lesson.model';

export enum CourseChangeRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

/**
 * Loại thay đổi mà một change request đại diện.
 * - `course.update`: cập nhật field cấp course (hành vi gốc, default cho row cũ).
 * - `lesson.create` / `lesson.update` / `lesson.delete`: thao tác lesson trên
 *   khóa học ĐÃ publish, chờ admin duyệt trước khi áp dụng vào bảng `lessons`.
 */
export enum CourseChangeRequestKind {
  COURSE_UPDATE = 'course.update',
  LESSON_CREATE = 'lesson.create',
  LESSON_UPDATE = 'lesson.update',
  LESSON_DELETE = 'lesson.delete',
  QUIZ_CREATE = 'quiz.create',
  QUIZ_UPDATE = 'quiz.update',
  QUIZ_DELETE = 'quiz.delete',
}

/**
 * Tập field cấp course được phép gói trong một change request.
 * Đúng các field của UpdateCourseDto sau khi đã normalize (camelCase),
 * nên có thể `course.update(payload)` trực tiếp khi admin approve.
 */
export type CourseUpdatePayload = Partial<{
  name: string;
  description: string | null;
  thumbnailUrl: string | null;
  categories: string[];
  level: CourseLevel;
  language: string;
  price: number;
  videoId: number | null;
}>;

/**
 * Tập field cấp lesson được phép gói trong một change request.
 * Khớp các field của Create/UpdateLessonDto nên admin approve có thể
 * `lesson.create(payload)` / `lesson.update(payload)` trực tiếp.
 */
export type LessonChangePayload = Partial<{
  courseId: number;
  videoId: number | null;
  title: string;
  contentType: ContentType;
  content: Record<string, unknown>;
  duration: string | null;
  status: LessonStatus;
  description: string;
}>;

/**
 * Tập field cấp quiz được phép gói trong một change request.
 * Khớp Create/UpdateQuizDto (questions là mảng câu hỏi lồng options) nên admin
 * approve có thể replay qua QuizzesService.createOne / update trực tiếp.
 * `quiz.delete` không cần field nào (chỉ dùng targetId).
 */
export type QuizChangePayload = Partial<{
  lessonActivityId: number;
  name: string;
  shuffleQuestion: boolean;
  shuffleOption: boolean;
  passingScore: number;
  timeLimitMinutes: number;
  isInVideo: boolean;
  questions: unknown[];
}>;

/** Payload của một change request — course-level, lesson-level hoặc quiz-level. */
export type ChangeRequestPayload =
  | CourseUpdatePayload
  | LessonChangePayload
  | QuizChangePayload;

@Table({
  tableName: 'course_change_requests',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class CourseChangeRequest extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  declare id: number;

  @ForeignKey(() => Course)
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'course_id' })
  declare courseId: number;

  @Column({ type: DataType.INTEGER, allowNull: false, field: 'requested_by' })
  declare requestedBy: number;

  @Column({ type: DataType.JSON, allowNull: false })
  declare payload: ChangeRequestPayload;

  /**
   * Ảnh chụp giá trị CŨ cho đúng các field có trong `payload` (course hoặc
   * lesson tùy `kind`), dùng để hiển thị diff (cũ → mới) khi admin duyệt.
   * Nullable cho các request tạo trước khi cột này tồn tại và cho `lesson.create`
   * (chưa có giá trị cũ).
   */
  @Column({ type: DataType.JSON, allowNull: true, field: 'prev_data' })
  declare prevData: ChangeRequestPayload | null;

  /**
   * Loại thay đổi. Default `course.update` để các row cũ (tạo trước migration
   * 046) giữ nguyên hành vi course-level.
   */
  @Column({
    type: DataType.ENUM(...Object.values(CourseChangeRequestKind)),
    allowNull: false,
    defaultValue: CourseChangeRequestKind.COURSE_UPDATE,
  })
  declare kind: CourseChangeRequestKind;

  /**
   * Id của lesson đích cho `lesson.update` / `lesson.delete`. Null với
   * `course.update` và `lesson.create` (chưa có lesson tương ứng).
   */
  @Column({ type: DataType.INTEGER, allowNull: true, field: 'target_id' })
  declare targetId: number | null;

  @Column({
    type: DataType.ENUM(...Object.values(CourseChangeRequestStatus)),
    allowNull: false,
    defaultValue: CourseChangeRequestStatus.PENDING,
  })
  declare status: CourseChangeRequestStatus;

  @Column({ type: DataType.INTEGER, allowNull: true, field: 'reviewed_by' })
  declare reviewedBy: number | null;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'review_note' })
  declare reviewNote: string | null;

  @BelongsTo(() => Course, { foreignKey: 'course_id', constraints: false })
  declare course?: Course;
}
