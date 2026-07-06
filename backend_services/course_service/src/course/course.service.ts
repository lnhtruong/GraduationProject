import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { Includeable, Order, Transaction, WhereOptions } from 'sequelize';
import { col, fn, literal, Op, where as sequelizeWhere } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { CreateCourseDto } from './dto/create-course.dto';
import { SearchCoursesQueryDto } from './dto/search-courses-query.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { Course, CourseStatus } from 'src/models/course.model';
import { Lesson, LessonStatus } from 'src/models/lesson.model';
import {
  LessonActivity,
  ActivityStatus,
  ActivityType,
} from 'src/models/lesson-activity.model';
import { Quiz } from 'src/models/quiz.model';
import { QuizQuestion } from 'src/models/quiz-question.model';
import { QuizOption } from 'src/models/quiz-option.model';
import { Enroll, EnrollStatus } from 'src/models/enroll.model';
import {
  CourseChangeRequest,
  CourseChangeRequestKind,
  CourseChangeRequestStatus,
  CourseUpdatePayload,
  ChangeRequestPayload,
  LessonChangePayload,
} from 'src/models/course-change-request.model';
import { EnrollsService } from 'src/enrolls/enrolls.service';
import { QuizzesService } from 'src/quizzes/quizzes.service';
import { Feedback } from 'src/models/feedback.model';
import { Video } from 'src/models/video.model';
import { AuditLogsService } from 'src/audit_logs/audit-logs.service';
import { RequesterContext } from 'src/audit_logs/requester.types';
import { PaginationMetaDto } from 'src/models/pagination.dto';
import { CourseSearchSort } from './dto/search-courses-query.dto';

type CourseSearchCard = {
  id: number;
  name: string;
  thumbnailUrl: string | null;
  price: number;
  categories: string[];
  level: string;
  language: string;
  duration: string | null;
  avgRating: number;
  reviewCount: number;
  enrollCount: number;
  instructorName: string;
  instructorAvatar: string | null;
  status: CourseStatus;
  createdAt: string | Date | null;
};

type CourseSearchResponse = {
  data: CourseSearchCard[];
  categories: CategorySummary[];
  total: number;
  page: number;
  totalPages: number;
};

type CategorySummary = {
  id: number;
  name: string;
  courseCount: number;
};

type CourseCategorySource = {
  categories?: unknown;
  get?: (options?: { plain?: boolean }) => Record<string, unknown>;
};

/** Diff của một field trong change request: giá trị cũ → giá trị mới. */
export type CourseChangeFieldDiff = {
  field: string;
  from: unknown;
  to: unknown;
};

/**
 * Change request kèm `changes` (diff cũ → mới) đã tính sẵn cho FE.
 * Spread từ `toJSON()` nên vẫn giữ nguyên `payload`, `prevData`, timestamps...
 */
export type CourseChangeRequestView = Record<string, unknown> & {
  payload: ChangeRequestPayload;
  prevData: ChangeRequestPayload | null;
  changes: CourseChangeFieldDiff[];
};

export type CoursePublicSort = 'newest' | 'popular' | 'rating';

/** Một bản ghi notification gửi tới media_service qua internal bulk endpoint. */
type InternalNotificationItem = {
  userId: number;
  eventType: string;
  sseEventType: string;
  title: string;
  message: string | null;
  payload: Record<string, unknown>;
  sourceType: string;
  sourceId: number;
};
import { InstructorFollow } from 'src/models/instructor-follow.model';
import {
  COURSE_CHANGE_APPROVED_EVENT,
  COURSE_CHANGE_REJECTED_EVENT,
  COURSE_PUBLISH_EVENT,
  COURSE_SOURCE,
  COURSE_UPDATED_EVENT,
} from 'src/models/notification.model';
import { User } from 'src/users/user.model';

const NOTIFY_CREATED_SSE_EVENT = 'notify:created';
const INTERNAL_NOTIFICATION_REQUEST_CHUNK_SIZE = 1000;

@Injectable()
export class CoursesService {
  constructor(
    @InjectModel(Course)
    private readonly courseModel: typeof Course,
    @InjectModel(Video)
    private readonly videoModel: typeof Video,
    @InjectModel(Lesson)
    private readonly lessonModel: typeof Lesson,
    @InjectModel(Enroll)
    private readonly enrollModel: typeof Enroll,
    @InjectModel(CourseChangeRequest)
    private readonly courseChangeRequestModel: typeof CourseChangeRequest,
    @InjectModel(Feedback)
    private readonly feedbackModel: typeof Feedback,
    @InjectModel(InstructorFollow)
    private readonly followModel: typeof InstructorFollow,
    @InjectModel(LessonActivity)
    private readonly lessonActivityModel: typeof LessonActivity,
    @InjectConnection()
    private readonly sequelize: Sequelize,
    private readonly auditLogsService: AuditLogsService,
    private readonly enrollsService: EnrollsService,
    @Inject(forwardRef(() => QuizzesService))
    private readonly quizzesService: QuizzesService,
  ) {}

  /**
   * BE-07: notify every follower of the publishing instructor that a new
   * course is live. Chunked at 200 rows per insert. Best-effort: any failure
   * is logged but does not break the publish flow.
   */
  private async notifyFollowersOfNewCourse(course: Course): Promise<void> {
    try {
      const instructorId = (course as any).userId;
      if (!instructorId) return;

      const [instructor, follows] = await Promise.all([
        User.findByPk(instructorId, {
          attributes: ['id', 'firstName', 'lastName', 'email'],
        }),
        this.followModel.findAll({
          where: { instructorId },
          attributes: ['followerId'],
        }),
      ]);

      if (follows.length === 0) return;

      const instructorName =
        [(instructor as any)?.firstName, (instructor as any)?.lastName]
          .filter(Boolean)
          .join(' ')
          .trim() ||
        (instructor as any)?.email ||
        'Giảng viên';
      const courseName = (course as any).name ?? 'a new course';
      const redirectUrl = `/courses/${course.id}`;
      const payloadBase = {
        courseId: course.id,
        courseName,
        instructorId,
        instructorName,
        redirectUrl,
      };

      const records: InternalNotificationItem[] = follows.map((f) => ({
        userId: f.followerId,
        eventType: COURSE_PUBLISH_EVENT,
        sseEventType: NOTIFY_CREATED_SSE_EVENT,
        title: 'Khóa học mới từ giảng viên bạn theo dõi',
        message: `${instructorName} vừa ra mắt khóa học mới: ${courseName}`,
        payload: payloadBase,
        sourceType: COURSE_SOURCE,
        sourceId: course.id,
      }));

      await this.dispatchInternalNotifications(records);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[courses] failed to notify followers of publish', err);
    }
  }

  /**
   * Gửi danh sách notification tới media_service qua internal bulk endpoint.
   * Best-effort: chunk theo lô, lỗi chỉ log chứ không ném (không được phá luồng
   * nghiệp vụ chính). Dùng chung cho publish, change-request approve...
   */
  private async dispatchInternalNotifications(
    items: InternalNotificationItem[],
  ): Promise<void> {
    if (items.length === 0) return;

    const mediaServiceUrl =
      process.env.MEDIA_SERVICE_URL || 'http://localhost:8003';
    const secret = process.env.INTERNAL_SERVICE_SECRET;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (secret) headers['x-internal-secret'] = secret;

    for (
      let i = 0;
      i < items.length;
      i += INTERNAL_NOTIFICATION_REQUEST_CHUNK_SIZE
    ) {
      const chunk = items.slice(
        i,
        i + INTERNAL_NOTIFICATION_REQUEST_CHUNK_SIZE,
      );
      try {
        const res = await fetch(
          `${mediaServiceUrl}/notifications/internal/bulk`,
          {
            method: 'POST',
            headers,
            body: JSON.stringify({ items: chunk }),
          },
        );
        if (!res.ok) {
          const text = await res.text();
          console.warn(
            `[courses] notification dispatch failed (${res.status}): ${text}`,
          );
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('[courses] notification dispatch error', err);
      }
    }
  }

  /** Copy noti gửi CHỦ KHÓA khi admin sửa trực tiếp khóa của họ, tùy `kind`. */
  private buildOwnerDirectChangeCopy(
    kind: CourseChangeRequestKind,
    courseName: string,
  ): { title: string; message: string } {
    switch (kind) {
      case CourseChangeRequestKind.LESSON_CREATE:
        return {
          title: 'Khóa học của bạn có bài học mới',
          message: `Quản trị viên vừa thêm một bài học vào khóa học "${courseName}" của bạn.`,
        };
      case CourseChangeRequestKind.LESSON_UPDATE:
        return {
          title: 'Bài học trong khóa của bạn được cập nhật',
          message: `Quản trị viên vừa cập nhật một bài học trong khóa học "${courseName}" của bạn.`,
        };
      case CourseChangeRequestKind.LESSON_DELETE:
        return {
          title: 'Một bài học trong khóa của bạn bị gỡ',
          message: `Quản trị viên vừa gỡ một bài học khỏi khóa học "${courseName}" của bạn.`,
        };
      case CourseChangeRequestKind.QUIZ_CREATE:
        return {
          title: 'Khóa học của bạn có bài kiểm tra mới',
          message: `Quản trị viên vừa thêm một bài kiểm tra vào khóa học "${courseName}" của bạn.`,
        };
      case CourseChangeRequestKind.QUIZ_UPDATE:
        return {
          title: 'Bài kiểm tra trong khóa của bạn được cập nhật',
          message: `Quản trị viên vừa cập nhật một bài kiểm tra trong khóa học "${courseName}" của bạn.`,
        };
      case CourseChangeRequestKind.QUIZ_DELETE:
        return {
          title: 'Một bài kiểm tra trong khóa của bạn bị gỡ',
          message: `Quản trị viên vừa gỡ một bài kiểm tra khỏi khóa học "${courseName}" của bạn.`,
        };
      case CourseChangeRequestKind.COURSE_UPDATE:
      default:
        return {
          title: 'Khóa học của bạn được cập nhật',
          message: `Quản trị viên vừa cập nhật khóa học "${courseName}" của bạn.`,
        };
    }
  }

  /** Copy noti gửi học viên, tùy loại thay đổi đã được duyệt. */
  private buildStudentUpdateCopy(
    kind: CourseChangeRequestKind,
    courseName: string,
  ): { title: string; message: string } {
    switch (kind) {
      case CourseChangeRequestKind.LESSON_CREATE:
        return {
          title: 'Khóa học có bài học mới',
          message: `Khóa học "${courseName}" bạn đã đăng ký vừa có bài học mới.`,
        };
      case CourseChangeRequestKind.LESSON_UPDATE:
        return {
          title: 'Bài học được cập nhật',
          message: `Một bài học trong khóa "${courseName}" vừa được cập nhật.`,
        };
      case CourseChangeRequestKind.LESSON_DELETE:
        return {
          title: 'Nội dung khóa học thay đổi',
          message: `Một bài học trong khóa "${courseName}" vừa được gỡ bỏ.`,
        };
      case CourseChangeRequestKind.QUIZ_CREATE:
        return {
          title: 'Khóa học có bài kiểm tra mới',
          message: `Khóa học "${courseName}" bạn đã đăng ký vừa có bài kiểm tra mới.`,
        };
      case CourseChangeRequestKind.QUIZ_UPDATE:
        return {
          title: 'Bài kiểm tra được cập nhật',
          message: `Một bài kiểm tra trong khóa "${courseName}" vừa được cập nhật.`,
        };
      case CourseChangeRequestKind.QUIZ_DELETE:
        return {
          title: 'Nội dung khóa học thay đổi',
          message: `Một bài kiểm tra trong khóa "${courseName}" vừa được gỡ bỏ.`,
        };
      case CourseChangeRequestKind.COURSE_UPDATE:
      default:
        return {
          title: 'Khóa học được cập nhật',
          message: `Khóa học "${courseName}" bạn đã đăng ký vừa được cập nhật.`,
        };
    }
  }

  /**
   * Sau khi admin approve một change request: lưu notification + bắn SSE cho
   * giảng viên (người yêu cầu + chủ khóa học) và toàn bộ học viên đã enroll.
   * Best-effort — không phá luồng approve nếu media_service lỗi.
   */
  private async notifyChangeRequestApproved(
    course: Course,
    request: CourseChangeRequest,
  ): Promise<void> {
    try {
      const courseId = course.id;
      const courseName =
        (course as Course & { name?: string }).name ?? 'khóa học';
      const kind = request.kind ?? CourseChangeRequestKind.COURSE_UPDATE;
      const redirectUrl = `/courses/${courseId}`;
      const items: InternalNotificationItem[] = [];

      // Giảng viên: người tạo request + chủ khóa học (dedup, thường trùng nhau).
      const teacherIds = new Set<number>();
      if (request.requestedBy) teacherIds.add(request.requestedBy);
      const ownerId = (course as Course & { userId?: number }).userId;
      if (ownerId) teacherIds.add(ownerId);

      for (const userId of teacherIds) {
        items.push({
          userId,
          eventType: COURSE_CHANGE_APPROVED_EVENT,
          sseEventType: NOTIFY_CREATED_SSE_EVENT,
          title: 'Yêu cầu thay đổi đã được duyệt',
          message: `Thay đổi của bạn cho khóa học "${courseName}" đã được duyệt và áp dụng.`,
          payload: {
            courseId,
            changeRequestId: request.id,
            kind,
            redirectUrl,
          },
          sourceType: COURSE_SOURCE,
          sourceId: courseId,
        });
      }

      // Học viên còn theo học (loại trừ enroll đã DROPPED — không cần báo nội
      // dung cập nhật; và loại trừ giảng viên để tránh noti trùng).
      const enrolls = await this.enrollModel.findAll({
        where: {
          courseId,
          status: {
            [Op.in]: [EnrollStatus.ACTIVE, EnrollStatus.COMPLETED],
          },
        },
        attributes: ['userId'],
      });
      const { title, message } = this.buildStudentUpdateCopy(kind, courseName);
      const notifiedStudents = new Set<number>();
      for (const enroll of enrolls) {
        const studentId = enroll.userId;
        if (teacherIds.has(studentId) || notifiedStudents.has(studentId)) {
          continue;
        }
        notifiedStudents.add(studentId);
        items.push({
          userId: studentId,
          eventType: COURSE_UPDATED_EVENT,
          sseEventType: NOTIFY_CREATED_SSE_EVENT,
          title,
          message,
          payload: { courseId, kind, redirectUrl },
          sourceType: COURSE_SOURCE,
          sourceId: courseId,
        });
      }

      await this.dispatchInternalNotifications(items);
    } catch (err) {
      console.warn('[courses] failed to notify change-request approval', err);
    }
  }

  /**
   * Sau khi admin reject một change request: lưu notification + bắn SSE cho
   * giảng viên (người yêu cầu + chủ khóa học). Học viên KHÔNG được báo vì nội
   * dung khóa học không đổi. Best-effort. Dùng findByPk nhẹ (không cần include
   * tree) và bỏ qua nếu course đã bị xoá.
   */
  private async notifyChangeRequestRejected(
    request: CourseChangeRequest,
    note?: string,
  ): Promise<void> {
    try {
      const course = await this.courseModel.findByPk(request.courseId, {
        attributes: ['id', 'name', 'userId'],
      });
      const courseName =
        (course as (Course & { name?: string }) | null)?.name ?? 'khóa học';

      const teacherIds = new Set<number>();
      if (request.requestedBy) teacherIds.add(request.requestedBy);
      const ownerId = (course as (Course & { userId?: number }) | null)?.userId;
      if (ownerId) teacherIds.add(ownerId);
      if (teacherIds.size === 0) return;

      const trimmedNote = note?.trim();
      const message = trimmedNote
        ? `Yêu cầu thay đổi khóa học "${courseName}" đã bị từ chối. Lý do: ${trimmedNote}`
        : `Yêu cầu thay đổi khóa học "${courseName}" đã bị từ chối.`;

      const items: InternalNotificationItem[] = [...teacherIds].map(
        (userId) => ({
          userId,
          eventType: COURSE_CHANGE_REJECTED_EVENT,
          sseEventType: NOTIFY_CREATED_SSE_EVENT,
          title: 'Yêu cầu thay đổi bị từ chối',
          message,
          payload: {
            courseId: request.courseId,
            changeRequestId: request.id,
            kind: request.kind ?? CourseChangeRequestKind.COURSE_UPDATE,
            redirectUrl: `/courses/${request.courseId}`,
            note: trimmedNote ?? null,
          },
          sourceType: COURSE_SOURCE,
          sourceId: request.courseId,
        }),
      );

      await this.dispatchInternalNotifications(items);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[courses] failed to notify change-request rejection', err);
    }
  }

  /**
   * Xoá các pending request đang trỏ tới một lesson (kind lesson.update /
   * lesson.delete) khi lesson đó bị xoá — tránh để lại request mồ côi không thể
   * áp dụng. `exceptRequestId` để chừa lại chính request đang được duyệt.
   */
  private async purgeLessonChangeRequests(
    lessonId: number,
    options: { exceptRequestId?: number; transaction?: Transaction } = {},
  ): Promise<void> {
    const where: WhereOptions = {
      targetId: lessonId,
      status: CourseChangeRequestStatus.PENDING,
      kind: {
        [Op.in]: [
          CourseChangeRequestKind.LESSON_UPDATE,
          CourseChangeRequestKind.LESSON_DELETE,
        ],
      },
    };
    if (options.exceptRequestId) {
      where.id = { [Op.ne]: options.exceptRequestId };
    }
    await this.courseChangeRequestModel.destroy({
      where,
      transaction: options.transaction,
    });
  }

  /**
   * Public: gọi khi một lesson bị xoá trực tiếp (course chưa publish) để dọn các
   * pending request mồ côi trỏ tới lesson đó. No-op nếu không có request nào.
   */
  async deletePendingRequestsForLesson(lessonId: number): Promise<void> {
    await this.purgeLessonChangeRequests(lessonId);
  }

  private auditableCourseSnapshot(course: Course) {
    return {
      id: course.id,
      name: (course as Course & { name?: string }).name ?? null,
      status: course.status,
      userId: (course as Course & { userId?: number }).userId ?? null,
    };
  }

  /**
   * Chụp giá trị HIỆN TẠI của course cho đúng các field xuất hiện trong
   * `payload`. Dùng làm `prev_data` để hiển thị diff khi duyệt change request.
   */
  private snapshotPreviousData(
    course: Course,
    payload: CourseUpdatePayload,
  ): CourseUpdatePayload {
    const snapshot: Record<string, unknown> = {};
    for (const key of Object.keys(payload)) {
      snapshot[key] = course.get(key as keyof Course) ?? null;
    }
    return snapshot as CourseUpdatePayload;
  }

  /** Tạo danh sách diff (cũ → mới) theo từng field có trong `payload`. */
  private buildChanges(
    payload: ChangeRequestPayload,
    prevData: ChangeRequestPayload | null,
  ): CourseChangeFieldDiff[] {
    const prev = (prevData ?? {}) as Record<string, unknown>;
    const next = payload as Record<string, unknown>;
    return Object.keys(next).map((field) => ({
      field,
      from: field in prev ? (prev[field] ?? null) : null,
      to: next[field] ?? null,
    }));
  }

  /** Bọc change request kèm `changes` đã tính sẵn cho FE. */
  private toChangeRequestView(
    request: CourseChangeRequest,
  ): CourseChangeRequestView {
    const json = request.toJSON() as Record<string, unknown>;
    return {
      ...json,
      changes: this.buildChanges(request.payload, request.prevData ?? null),
    } as CourseChangeRequestView;
  }

  private readonly ADMIN_ROLE = 1;
  private readonly LECTURER_ROLE = 3;
  private readonly courseVideoInclude: Includeable[] = [
    {
      model: Video,
      as: 'video',
      required: false,
    },
  ];

  private readonly publicCourseAggregateAttributes = [
    [
      literal(`(
        SELECT COALESCE(AVG(feedbacks.rating), 0)
        FROM feedbacks
        WHERE feedbacks.course_id = Course.id
          AND feedbacks.deleted_at IS NULL
          AND feedbacks.is_visible = TRUE
      )`),
      'avg_rating',
    ],
    [
      literal(`(
        SELECT COUNT(feedbacks.id)
        FROM feedbacks
        WHERE feedbacks.course_id = Course.id
          AND feedbacks.deleted_at IS NULL
          AND feedbacks.is_visible = TRUE
      )`),
      'review_count',
    ],
    [
      literal(`(
        SELECT COUNT(enrolls.id)
        FROM enrolls
        WHERE enrolls.course_id = Course.id
      )`),
      'enrolled_count',
    ],
  ] as const;

  private buildPublicCourseInclude(): Includeable[] {
    return [
      {
        model: Video,
        as: 'video',
        required: false,
        attributes: ['id', 'url', 'thumbnail', 'duration', 'type'],
      },
      {
        model: User,
        as: 'instructor',
        required: false,
        attributes: ['id', 'firstName', 'lastName', 'avatarUrl'],
      },
    ];
  }

  private buildPublicCourseOrder(sort?: string): Order {
    switch (sort) {
      case 'popular':
        return [
          [literal('enrolled_count'), 'DESC'],
          ['id', 'DESC'],
        ] as Order;
      case 'rating':
        return [
          [literal('avg_rating'), 'DESC'],
          ['id', 'DESC'],
        ] as Order;
      case 'newest':
      default:
        return [['id', 'DESC']];
    }
  }

  private async validateVideoId(
    videoId: number | null | undefined,
  ): Promise<void> {
    if (videoId === undefined || videoId === null) {
      return;
    }

    const video = await this.videoModel.findByPk(videoId, {
      attributes: ['id'],
    });

    if (!video) {
      throw new BadRequestException(`Video with ID ${videoId} not found`);
    }
  }

  private normalizeThumbnailUrl(
    value: string | null | undefined,
  ): string | null | undefined {
    if (value === undefined) {
      return undefined;
    }

    if (value === null) {
      return null;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private buildCourseWritePayload(dto: CreateCourseDto | UpdateCourseDto) {
    const { thumbnail_url, thumbnailUrl, ...payload } = dto;
    const hasCamelCaseThumbnail = Object.prototype.hasOwnProperty.call(
      dto,
      'thumbnailUrl',
    );
    const rawThumbnailUrl = hasCamelCaseThumbnail
      ? thumbnailUrl
      : thumbnail_url;
    const normalizedThumbnailUrl = this.normalizeThumbnailUrl(rawThumbnailUrl);

    if (normalizedThumbnailUrl === undefined) {
      return payload;
    }

    return {
      ...payload,
      thumbnailUrl: normalizedThumbnailUrl,
    };
  }

  private escapeLikePattern(value: string): string {
    return value.replace(/[\\%_]/g, (match) => `\\${match}`);
  }

  private parsePositiveInteger(
    value: number | undefined,
    fallback: number,
    max?: number,
  ): number {
    if (!Number.isInteger(value) || value! <= 0) {
      return fallback;
    }
    return max ? Math.min(value!, max) : value!;
  }

  private parseSearchNumber(value: unknown): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private normalizeCategories(value: unknown): string[] {
    const parsed =
      typeof value === 'string'
        ? (() => {
            try {
              return JSON.parse(value);
            } catch {
              return [];
            }
          })()
        : value;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter((item) => item.length > 0);
  }

  private readCourseCategories(course: CourseCategorySource): unknown {
    if (typeof course.get === 'function') {
      return course.get({ plain: true }).categories;
    }

    return course.categories;
  }

  private countCategoriesFromCourses(
    courses: CourseCategorySource[],
  ): Map<string, number> {
    const counts = new Map<string, number>();
    for (const course of courses) {
      const uniqueCategories = new Set(
        this.normalizeCategories(this.readCourseCategories(course)),
      );
      for (const category of uniqueCategories) {
        counts.set(category, (counts.get(category) ?? 0) + 1);
      }
    }

    return counts;
  }

  private mapCategoryCountsToSummaries(
    counts: Map<string, number>,
    categoryIdByName?: Map<string, number>,
  ): CategorySummary[] {
    return [...counts.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([name, courseCount], index) => ({
        id: categoryIdByName?.get(name) ?? index + 1,
        name,
        courseCount,
      }));
  }

  private async getCategorySummaries(): Promise<CategorySummary[]> {
    const courses = await this.courseModel.findAll({
      where: { status: CourseStatus.PUBLISH },
      attributes: ['categories'],
      raw: true,
    });

    return this.mapCategoryCountsToSummaries(
      this.countCategoriesFromCourses(courses as CourseCategorySource[]),
    );
  }

  async findCategories(): Promise<CategorySummary[]> {
    return this.getCategorySummaries();
  }

  private escapeSqlValue(value: string): string {
    const sequelize = this.courseModel.sequelize;
    if (!sequelize) {
      return `'${value.replace(/'/g, "''")}'`;
    }
    return sequelize.escape(value);
  }

  private buildCategoryFilter(categoryNames: string[]) {
    return {
      [Op.or]: categoryNames.map((categoryName) =>
        literal(
          `JSON_CONTAINS(\`Course\`.\`categories\`, JSON_QUOTE(${this.escapeSqlValue(categoryName)}))`,
        ),
      ),
    };
  }

  private getSearchAggregateSql() {
    const avgRatingSql = `(
      SELECT COALESCE(AVG(feedbacks.rating), 0)
      FROM feedbacks
      WHERE feedbacks.course_id = Course.id
        AND feedbacks.deleted_at IS NULL
        AND feedbacks.is_visible = TRUE
    )`;
    const reviewCountSql = `(
      SELECT COUNT(feedbacks.id)
      FROM feedbacks
      WHERE feedbacks.course_id = Course.id
        AND feedbacks.deleted_at IS NULL
        AND feedbacks.is_visible = TRUE
    )`;
    const enrollCountSql = `(
      SELECT COUNT(enrolls.id)
      FROM enrolls
      WHERE enrolls.course_id = Course.id
    )`;

    return { avgRatingSql, reviewCountSql, enrollCountSql };
  }

  private buildSearchOrder(sort: CourseSearchSort = 'newest'): Order {
    switch (sort) {
      case 'popular':
        return [
          [literal('enrollCount'), 'DESC'],
          ['id', 'DESC'],
        ] as Order;
      case 'rating':
        return [
          [literal('avgRating'), 'DESC'],
          ['id', 'DESC'],
        ] as Order;
      case 'price_asc':
        return [
          ['price', 'ASC'],
          ['id', 'DESC'],
        ] as Order;
      case 'price_desc':
        return [
          ['price', 'DESC'],
          ['id', 'DESC'],
        ] as Order;
      case 'newest':
      default:
        return [
          [literal('`Course`.`created_at`'), 'DESC'],
          ['id', 'DESC'],
        ] as Order;
    }
  }

  private mapCourseSearchCard(course: Course): CourseSearchCard {
    const plain = course.get({ plain: true }) as Record<string, any>;
    const instructor = plain.instructor as Record<string, unknown> | undefined;
    const instructorName = [instructor?.firstName, instructor?.lastName]
      .filter(
        (part): part is string =>
          typeof part === 'string' && part.trim().length > 0,
      )
      .join(' ')
      .trim();

    return {
      id: this.parseSearchNumber(plain.id),
      name: String(plain.name ?? ''),
      thumbnailUrl:
        plain.thumbnailUrl ??
        plain.thumbnail_url ??
        plain.video?.thumbnail ??
        null,
      price: this.parseSearchNumber(plain.price),
      categories: plain.categories ?? [],
      level: String(plain.level ?? ''),
      language: String(plain.language ?? ''),
      duration: plain.duration ?? null,
      avgRating: this.parseSearchNumber(plain.avgRating),
      reviewCount: this.parseSearchNumber(plain.reviewCount),
      enrollCount: this.parseSearchNumber(plain.enrollCount),
      instructorName,
      instructorAvatar:
        typeof instructor?.avatarUrl === 'string' &&
        instructor.avatarUrl.trim().length > 0
          ? instructor.avatarUrl
          : null,
      status: plain.status,
      createdAt: plain.createdAt ?? plain.created_at ?? null,
    };
  }

  async searchPublishedCourses(
    query: SearchCoursesQueryDto,
  ): Promise<CourseSearchResponse> {
    const page = this.parsePositiveInteger(query.page, 1);
    const limit = this.parsePositiveInteger(query.limit, 12, 100);
    const offset = (page - 1) * limit;
    const keyword = query.q?.trim();
    const andConditions: Array<WhereOptions | ReturnType<typeof literal>> = [
      { status: CourseStatus.PUBLISH },
    ];
    let categorySummaries: CategorySummary[] | undefined;
    const getPublishedCategorySummaries = async () => {
      categorySummaries ??= await this.getCategorySummaries();
      return categorySummaries;
    };

    if (
      query.minPrice !== undefined &&
      query.maxPrice !== undefined &&
      query.minPrice > query.maxPrice
    ) {
      throw new BadRequestException(
        'minPrice must be less than or equal to maxPrice',
      );
    }

    if (keyword) {
      const likeKeyword = `%${this.escapeLikePattern(keyword.toLowerCase())}%`;
      andConditions.push({
        [Op.or]: [
          sequelizeWhere(fn('LOWER', col('Course.name')), {
            [Op.like]: likeKeyword,
          }),
          sequelizeWhere(fn('LOWER', col('Course.description')), {
            [Op.like]: likeKeyword,
          }),
        ],
      });
    }

    if (query.level) {
      andConditions.push({ level: query.level });
    }

    const priceCondition: Record<symbol, number | [number, number]> = {};
    if (query.minPrice !== undefined && query.maxPrice !== undefined) {
      priceCondition[Op.between] = [query.minPrice, query.maxPrice];
    } else {
      if (query.minPrice !== undefined) {
        priceCondition[Op.gte] = query.minPrice;
      }
      if (query.maxPrice !== undefined) {
        priceCondition[Op.lte] = query.maxPrice;
      }
    }
    if (Object.getOwnPropertySymbols(priceCondition).length > 0) {
      andConditions.push({ price: priceCondition });
    }

    if (query.categoryIds?.length) {
      const categorySummaries = await getPublishedCategorySummaries();
      const categoryNameById = new Map(
        categorySummaries.map((category) => [category.id, category.name]),
      );
      const categoryNames = [...new Set(query.categoryIds)]
        .map((categoryId) => categoryNameById.get(categoryId))
        .filter((categoryName): categoryName is string =>
          Boolean(categoryName),
        );

      if (categoryNames.length === 0) {
        andConditions.push(literal('1 = 0'));
      } else {
        andConditions.push(this.buildCategoryFilter(categoryNames));
      }
    }

    const whereCondition = { [Op.and]: andConditions };
    const { avgRatingSql, reviewCountSql, enrollCountSql } =
      this.getSearchAggregateSql();
    const having =
      query.minRating !== undefined
        ? literal(`${avgRatingSql} >= ${query.minRating}`)
        : undefined;

    const rows = await this.courseModel.findAll({
      where: whereCondition,
      attributes: [
        'id',
        'name',
        'thumbnailUrl',
        'price',
        'level',
        'language',
        'duration',
        'categories',
        'status',
        [col('Course.created_at'), 'createdAt'],
        [literal(avgRatingSql), 'avgRating'],
        [literal(reviewCountSql), 'reviewCount'],
        [literal(enrollCountSql), 'enrollCount'],
      ],
      include: [
        {
          model: User,
          as: 'instructor',
          required: false,
          attributes: ['firstName', 'lastName', 'avatarUrl'],
        },
        {
          model: Video,
          as: 'video',
          required: false,
          attributes: ['thumbnail'],
        },
      ],
      having,
      order: this.buildSearchOrder(query.sort),
      limit,
      offset,
      subQuery: false,
    });

    const countRows = await this.courseModel.findAll({
      where: whereCondition,
      attributes: ['id'],
      having,
      raw: true,
    });

    const pagination = new PaginationMetaDto(page, limit, countRows.length);
    const categoryCounts = this.countCategoriesFromCourses(rows);
    const categoryIdByName =
      categoryCounts.size > 0
        ? new Map(
            (await getPublishedCategorySummaries()).map((category) => [
              category.name,
              category.id,
            ]),
          )
        : undefined;

    return {
      data: rows.map((course) => this.mapCourseSearchCard(course)),
      categories: this.mapCategoryCountsToSummaries(
        categoryCounts,
        categoryIdByName,
      ),
      total: pagination.totalItems,
      page: pagination.page,
      totalPages: pagination.totalPages,
    };
  }

  async create(
    createCourseDto: CreateCourseDto,
    userId: number | undefined,
  ): Promise<Course> {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    await this.validateVideoId(createCourseDto.videoId);
    const coursePayload = this.buildCourseWritePayload(createCourseDto);

    const createdCourse = await this.courseModel.create({
      ...coursePayload,
      videoId: createCourseDto.videoId ?? null,
      userId: userId,
      level: createCourseDto.level ?? undefined,
      status: CourseStatus.DRAFT,
      duration: '00:00:00.000',
    });

    return await this.findOne(createdCourse.id);
  }

  async findAll(
    userId: number | undefined,
    status?: CourseStatus,
    page?: number,
    limit?: number,
  ): Promise<
    | Course[]
    | {
        data: Course[];
        pagination: {
          page: number;
          limit: number;
          totalItems: number;
          totalPages: number;
        };
      }
  > {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }
    const whereCondition: any = {};

    if (typeof userId === 'number' && !Number.isNaN(userId)) {
      whereCondition.userId = userId;
    }

    if (status) {
      whereCondition.status = status;
    }

    const shouldPaginate = page !== undefined || limit !== undefined;

    if (!shouldPaginate) {
      return await this.courseModel.findAll({
        where: whereCondition,
        include: [Video],
      });
    }

    const safePage = Number.isInteger(page) && page! > 0 ? page! : 1;
    const safeLimit =
      Number.isInteger(limit) && limit! > 0 ? Math.min(limit!, 100) : 10;
    const offset = (safePage - 1) * safeLimit;

    const { rows, count } = await this.courseModel.findAndCountAll({
      where: whereCondition,
      include: [Video],
      offset,
      limit: safeLimit,
      order: [['id', 'DESC']],
    });

    return {
      data: rows,
      pagination: {
        page: safePage,
        limit: safeLimit,
        totalItems: count,
        totalPages: Math.ceil(count / safeLimit),
      },
    };
  }

  async findAllPublic(
    params: {
      status?: CourseStatus;
      page?: number;
      limit?: number;
      search?: string;
      level?: string;
      minPrice?: number;
      maxPrice?: number;
      userId?: number;
      requesterRole?: number;
      sort?: CoursePublicSort;
    } = {},
  ): Promise<
    | Course[]
    | {
        data: Course[];
        pagination: {
          page: number;
          limit: number;
          totalItems: number;
          totalPages: number;
        };
      }
  > {
    const {
      status,
      page,
      limit,
      search,
      level,
      minPrice,
      maxPrice,
      userId,
      sort,
      requesterRole,
    } = params;
    const isAdmin = requesterRole === this.ADMIN_ROLE;
    const whereCondition: any = {};
    const effectiveStatus = isAdmin ? status : CourseStatus.PUBLISH;

    if (!isAdmin && status && status !== CourseStatus.PUBLISH) {
      throw new ForbiddenException(
        'Only admin can filter courses by this status',
      );
    }

    if (effectiveStatus) {
      whereCondition.status = effectiveStatus;
    }

    if (level) {
      whereCondition.level = level;
    }

    if (typeof userId === 'number' && Number.isInteger(userId) && userId > 0) {
      if (!isAdmin) {
        throw new ForbiddenException(
          'Only admin can filter courses by lecturer userId',
        );
      }
      whereCondition.userId = userId;
    }

    const priceCondition: Record<symbol, number> = {};
    if (typeof minPrice === 'number' && Number.isFinite(minPrice)) {
      priceCondition[Op.gte] = minPrice;
    }
    if (typeof maxPrice === 'number' && Number.isFinite(maxPrice)) {
      priceCondition[Op.lte] = maxPrice;
    }
    if (Object.getOwnPropertySymbols(priceCondition).length > 0) {
      whereCondition.price = priceCondition;
    }
    const keyword = search?.trim();
    if (keyword) {
      whereCondition.name = { [Op.like]: `%${keyword}%` };
    }

    const queryOptions = {
      where: whereCondition,
      include: this.buildPublicCourseInclude(),
      attributes: {
        include: this.publicCourseAggregateAttributes as any,
      },
      order: this.buildPublicCourseOrder(sort),
    };

    const shouldPaginate = page !== undefined || limit !== undefined;

    if (!shouldPaginate) {
      return await this.courseModel.findAll({
        ...queryOptions,
      });
    }

    const safePage = Number.isInteger(page) && page! > 0 ? page! : 1;
    const safeLimit =
      Number.isInteger(limit) && limit! > 0 ? Math.min(limit!, 100) : 10;
    const offset = (safePage - 1) * safeLimit;

    const { rows, count } = await this.courseModel.findAndCountAll({
      ...queryOptions,
      offset,
      limit: safeLimit,
      distinct: true,
    });

    return {
      data: rows,
      pagination: {
        page: safePage,
        limit: safeLimit,
        totalItems: count,
        totalPages: Math.ceil(count / safeLimit),
      },
    };
  }

  /**
   * Build the nested include tree to eager-load:
   *   Course → Video
   *           → Lessons (active/blocked, not removed)
   *               → Video (lesson video, minimal fields)
   *               → LessonActivities (not removed)
   *                   → Quizzes
   *                       → QuizQuestions
   *                           → QuizOptions
   *
   * Goal: replace 1+N round-trips with a single (left-joined) query.
   * `attributes` are pruned per level so we don't ship big text columns we don't need.
   */
  private buildCourseDetailInclude(): Includeable[] {
    return [
      // Preview video gắn ở Course level
      {
        model: Video,
        as: 'video',
        required: false,
        attributes: ['id', 'url', 'duration', 'thumbnail', 'type'],
      },
      {
        model: Lesson,
        as: 'lessons',
        required: false,
        where: { status: { [Op.ne]: LessonStatus.REMOVED } },
        attributes: [
          'id',
          'courseId',
          'videoId',
          'title',
          'contentType',
          'duration',
          'status',
          'description',
        ],
        include: [
          {
            model: Video,
            required: false,
            attributes: ['id', 'url', 'duration', 'thumbnail'],
          },
          {
            model: LessonActivity,
            as: 'lessonActivities',
            required: false,
            where: { status: { [Op.ne]: ActivityStatus.REMOVED } },
            attributes: [
              'id',
              'lessonId',
              'activityType',
              'title',
              'orderIndex',
              'maxAttempts',
              'status',
            ],
            include: [
              {
                model: Quiz,
                as: 'quizzes',
                required: false,
                attributes: [
                  'id',
                  'lessonActivityId',
                  'name',
                  'shuffleQuestion',
                  'shuffleOption',
                  'passingScore',
                  'timeLimitMinutes',
                  'isInVideo',
                ],
                include: [
                  {
                    model: QuizQuestion,
                    as: 'questions',
                    required: false,
                    attributes: [
                      'id',
                      'quizId',
                      'quesType',
                      'quesText',
                      'point',
                      'correctAns',
                      'orderIndex',
                      'videoTimestamp',
                    ],
                    include: [
                      {
                        model: QuizOption,
                        as: 'options',
                        required: false,
                        attributes: [
                          'id',
                          'questionId',
                          'optionText',
                          'isCorrect',
                          'orderIndex',
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ];
  }

  private buildCourseDetailOrder(): Order {
    // Sequelize hỗ trợ order theo nested association ở dạng
    //   [assoc1, assoc2, ..., column, direction]
    // nhưng kiểu định nghĩa TypeScript chỉ phủ tới 4 cấp. Cast về Order để
    // tránh phải xếp lại bằng raw literal (vẫn type-safe ở runtime).
    return [
      [{ model: Lesson, as: 'lessons' }, 'id', 'ASC'],
      [
        { model: Lesson, as: 'lessons' },
        { model: LessonActivity, as: 'lessonActivities' },
        'orderIndex',
        'ASC',
      ],
      [
        { model: Lesson, as: 'lessons' },
        { model: LessonActivity, as: 'lessonActivities' },
        { model: Quiz, as: 'quizzes' },
        'id',
        'ASC',
      ],
      [
        { model: Lesson, as: 'lessons' },
        { model: LessonActivity, as: 'lessonActivities' },
        { model: Quiz, as: 'quizzes' },
        { model: QuizQuestion, as: 'questions' },
        'orderIndex',
        'ASC',
      ],
      [
        { model: Lesson, as: 'lessons' },
        { model: LessonActivity, as: 'lessonActivities' },
        { model: Quiz, as: 'quizzes' },
        { model: QuizQuestion, as: 'questions' },
        { model: QuizOption, as: 'options' },
        'orderIndex',
        'ASC',
      ],
    ] as unknown as Order;
  }

  async findOne(
    id: number,
    requesterUserId?: number,
    requesterRole?: number,
    enforceStatusCheck = false,
  ): Promise<Course> {
    const course = await this.courseModel.findByPk(id, {
      include: this.buildCourseDetailInclude(),
      order: this.buildCourseDetailOrder(),
      // findByPk → một row Course duy nhất, không phân trang → set subQuery: false
      // để Sequelize tạo một SELECT JOIN duy nhất thay vì wrap subquery.
      subQuery: false,
    });
    if (!course) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }

    const isAdmin = requesterRole === this.ADMIN_ROLE;
    const isOwner = requesterUserId === course.userId;

    if (enforceStatusCheck && course.status !== CourseStatus.PUBLISH) {
      if (!isAdmin && !isOwner) {
        throw new ForbiddenException(
          'You do not have permission to access this course',
        );
      }
    }

    if (!isAdmin && !isOwner) {
      if (course.lessons) {
        for (const lesson of course.lessons) {
          if (lesson.lessonActivities) {
            lesson.lessonActivities = lesson.lessonActivities.filter(
              (activity) => activity.status === ActivityStatus.PUBLIC,
            );
          }
        }
      }
    }

    return course;
  }

  private normalizePercentage(value: number): number {
    if (!Number.isFinite(value) || value <= 0) {
      return 0;
    }
    return Number(value.toFixed(2));
  }

  private parseNumberValue(value: unknown): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private async assertCourseStatsAccess(
    course: Course,
    requesterUserId: number,
    requesterRole: number,
  ): Promise<void> {
    if (requesterRole === this.ADMIN_ROLE) {
      return;
    }

    if (
      requesterRole === this.LECTURER_ROLE &&
      course.userId === requesterUserId
    ) {
      return;
    }

    throw new ForbiddenException(
      'You are not allowed to access this course statistics',
    );
  }

  async getCourseStatsOverview(
    courseId: number,
    requesterUserId: number,
    requesterRole: number,
  ) {
    const course = await this.findOne(courseId);
    await this.assertCourseStatsAccess(course, requesterUserId, requesterRole);

    const [
      totalEnrollments,
      activeEnrollments,
      completedEnrollments,
      averageProgressRow,
      totalReviews,
      averageRatingRow,
      ratingRows,
    ] = await Promise.all([
      this.enrollModel.count({ where: { courseId } }),
      this.enrollModel.count({
        where: { courseId, status: EnrollStatus.ACTIVE },
      }),
      this.enrollModel.count({
        where: { courseId, status: EnrollStatus.COMPLETED },
      }),
      this.enrollModel.findOne({
        where: { courseId },
        attributes: [[fn('AVG', col('progress')), 'averageProgress']],
        raw: true,
      }),
      this.feedbackModel.count({ where: { courseId, isVisible: true } }),
      this.feedbackModel.findOne({
        where: { courseId, isVisible: true },
        attributes: [[fn('AVG', col('rating')), 'averageRating']],
        raw: true,
      }),
      this.feedbackModel.findAll({
        where: { courseId, isVisible: true },
        attributes: ['rating', [fn('COUNT', col('id')), 'count']],
        group: ['rating'],
        raw: true,
      }),
    ]);

    const averageProgress = this.parseNumberValue(
      (averageProgressRow as { averageProgress?: unknown } | null)
        ?.averageProgress,
    );
    const averageRating = this.parseNumberValue(
      (averageRatingRow as { averageRating?: unknown } | null)?.averageRating,
    );
    const completionRate =
      totalEnrollments > 0
        ? (completedEnrollments / totalEnrollments) * 100
        : 0;

    const ratingRowsData = ratingRows as unknown as Array<{
      rating: unknown;
      count: unknown;
    }>;
    const ratingCountMap = new Map<number, number>();
    for (const row of ratingRowsData) {
      ratingCountMap.set(
        this.parseNumberValue(row.rating),
        this.parseNumberValue(row.count),
      );
    }

    const distribution = [5, 4, 3, 2, 1].map((rating) => {
      const count = ratingCountMap.get(rating) ?? 0;
      const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
      return {
        rating,
        count,
        percentage: this.normalizePercentage(percentage),
      };
    });

    return {
      courseId: course.id,
      courseName: course.name,
      enrollment: {
        total: totalEnrollments,
        active: activeEnrollments,
        completed: completedEnrollments,
        completionRate: this.normalizePercentage(completionRate),
        averageProgress: this.normalizePercentage(averageProgress),
      },
      ratings: {
        totalReviews,
        averageRating: this.normalizePercentage(averageRating),
        distribution,
      },
    };
  }

  async getOverviewStats(requesterUserId: number, requesterRole: number) {
    const courseWhere: Record<string, unknown> = {};
    if (requesterRole === this.LECTURER_ROLE) {
      courseWhere.userId = requesterUserId;
    }
    if (
      requesterRole !== this.ADMIN_ROLE &&
      requesterRole !== this.LECTURER_ROLE
    ) {
      throw new ForbiddenException(
        'You are not allowed to access course statistics',
      );
    }

    const courses = await this.courseModel.findAll({
      where: courseWhere,
      attributes: ['id', 'name'],
      raw: true,
    });

    const courseIds = courses.map((course) => this.parseNumberValue(course.id));
    if (courseIds.length === 0) {
      return {
        summary: {
          totalCourses: 0,
          totalEnrollments: 0,
          activeEnrollments: 0,
          completedEnrollments: 0,
          completionRate: 0,
          averageProgress: 0,
          totalReviews: 0,
          averageRating: 0,
        },
        courses: [],
      };
    }

    const [enrollAggRows, ratingAggRows] = await Promise.all([
      this.enrollModel.findAll({
        where: { courseId: { [Op.in]: courseIds } },
        attributes: [
          'courseId',
          [fn('COUNT', col('id')), 'totalEnrollments'],
          [
            fn(
              'SUM',
              literal(
                `CASE WHEN status = '${EnrollStatus.ACTIVE}' THEN 1 ELSE 0 END`,
              ),
            ),
            'activeEnrollments',
          ],
          [
            fn(
              'SUM',
              literal(
                `CASE WHEN status = '${EnrollStatus.COMPLETED}' THEN 1 ELSE 0 END`,
              ),
            ),
            'completedEnrollments',
          ],
          [fn('AVG', col('progress')), 'averageProgress'],
        ],
        group: ['courseId'],
        raw: true,
      }),
      this.feedbackModel.findAll({
        where: {
          courseId: { [Op.in]: courseIds },
          isVisible: true,
        },
        attributes: [
          'courseId',
          [fn('COUNT', col('id')), 'totalReviews'],
          [fn('AVG', col('rating')), 'averageRating'],
        ],
        group: ['courseId'],
        raw: true,
      }),
    ]);

    const enrollAggMap = new Map<
      number,
      {
        totalEnrollments: number;
        activeEnrollments: number;
        completedEnrollments: number;
        averageProgress: number;
      }
    >();
    const enrollAggRowsData = enrollAggRows as unknown as Array<
      Record<string, unknown>
    >;
    for (const row of enrollAggRowsData) {
      const courseId = this.parseNumberValue(row.courseId);
      enrollAggMap.set(courseId, {
        totalEnrollments: this.parseNumberValue(row.totalEnrollments),
        activeEnrollments: this.parseNumberValue(row.activeEnrollments),
        completedEnrollments: this.parseNumberValue(row.completedEnrollments),
        averageProgress: this.parseNumberValue(row.averageProgress),
      });
    }

    const ratingAggMap = new Map<
      number,
      {
        totalReviews: number;
        averageRating: number;
      }
    >();
    const ratingAggRowsData = ratingAggRows as unknown as Array<
      Record<string, unknown>
    >;
    for (const row of ratingAggRowsData) {
      const courseId = this.parseNumberValue(row.courseId);
      ratingAggMap.set(courseId, {
        totalReviews: this.parseNumberValue(row.totalReviews),
        averageRating: this.parseNumberValue(row.averageRating),
      });
    }

    const courseItems = courses.map((course) => {
      const courseId = this.parseNumberValue(course.id);
      const enrollAgg = enrollAggMap.get(courseId) ?? {
        totalEnrollments: 0,
        activeEnrollments: 0,
        completedEnrollments: 0,
        averageProgress: 0,
      };
      const ratingAgg = ratingAggMap.get(courseId) ?? {
        totalReviews: 0,
        averageRating: 0,
      };
      const completionRate =
        enrollAgg.totalEnrollments > 0
          ? (enrollAgg.completedEnrollments / enrollAgg.totalEnrollments) * 100
          : 0;

      return {
        courseId,
        courseName: String(course.name),
        enrollment: {
          total: enrollAgg.totalEnrollments,
          active: enrollAgg.activeEnrollments,
          completed: enrollAgg.completedEnrollments,
          completionRate: this.normalizePercentage(completionRate),
          averageProgress: this.normalizePercentage(enrollAgg.averageProgress),
        },
        ratings: {
          totalReviews: ratingAgg.totalReviews,
          averageRating: this.normalizePercentage(ratingAgg.averageRating),
        },
      };
    });

    const summary = courseItems.reduce(
      (acc, item) => {
        acc.totalEnrollments += item.enrollment.total;
        acc.activeEnrollments += item.enrollment.active;
        acc.completedEnrollments += item.enrollment.completed;
        acc.totalReviews += item.ratings.totalReviews;
        acc.progressWeightedSum +=
          item.enrollment.averageProgress * item.enrollment.total;
        acc.ratingWeightedSum +=
          item.ratings.averageRating * item.ratings.totalReviews;
        return acc;
      },
      {
        totalCourses: courseItems.length,
        totalEnrollments: 0,
        activeEnrollments: 0,
        completedEnrollments: 0,
        totalReviews: 0,
        progressWeightedSum: 0,
        ratingWeightedSum: 0,
      },
    );

    const completionRate =
      summary.totalEnrollments > 0
        ? (summary.completedEnrollments / summary.totalEnrollments) * 100
        : 0;
    const averageProgress =
      summary.totalEnrollments > 0
        ? summary.progressWeightedSum / summary.totalEnrollments
        : 0;
    const averageRating =
      summary.totalReviews > 0
        ? summary.ratingWeightedSum / summary.totalReviews
        : 0;

    return {
      summary: {
        totalCourses: summary.totalCourses,
        totalEnrollments: summary.totalEnrollments,
        activeEnrollments: summary.activeEnrollments,
        completedEnrollments: summary.completedEnrollments,
        completionRate: this.normalizePercentage(completionRate),
        averageProgress: this.normalizePercentage(averageProgress),
        totalReviews: summary.totalReviews,
        averageRating: this.normalizePercentage(averageRating),
      },
      courses: courseItems,
    };
  }

  /**
   * Cập nhật course.
   * - Course ở `PUBLISH` hoặc `APPROVED` (non-admin) → KHÔNG sửa trực tiếp. Tự
   *   động tạo (hoặc ghi đè) một change request `pending` để admin duyệt; course
   *   giữ nguyên trạng thái và nội dung live. Trả về change request thay vì course.
   *   (`approved` = admin đã duyệt nội dung, sửa thì phải duyệt lại — đồng bộ với
   *   lesson/quiz.)
   * - Các trạng thái khác (draft/pending/rejected/banned) → sửa trực tiếp, đưa
   *   về `DRAFT` (hành vi cũ).
   * - Admin: toàn quyền, sửa trực tiếp mọi trạng thái.
   * Tối đa 1 request `pending` / course: gọi lại sẽ ghi đè payload pending.
   */
  async update(
    id: number,
    updateCourseDto: UpdateCourseDto,
    requester: RequesterContext,
  ): Promise<Course | CourseChangeRequest> {
    // Check permission TRƯỚC khi lộ tồn tại: non-admin không phải chủ khóa —
    // kể cả khi khóa không tồn tại — đều nhận 403, không tiết lộ khóa có tồn
    // tại hay không. Admin: lỗi 404 bình thường.
    const isAdmin = requester.role === this.ADMIN_ROLE;
    let course: Course;
    try {
      course = await this.findOne(id);
    } catch (err) {
      if (isAdmin) throw err;
      throw new ForbiddenException('You are not the owner of this course');
    }
    const ownerId = (course as Course & { userId?: number }).userId;
    if (!isAdmin && ownerId !== requester.userId) {
      throw new ForbiddenException('You are not the owner of this course');
    }

    await this.validateVideoId(updateCourseDto.videoId);
    const payload = this.buildCourseWritePayload(
      updateCourseDto,
    ) as CourseUpdatePayload;

    // Non-admin sửa course ở publish (đang live) hoặc approved (đã duyệt nội
    // dung) → tạo change request chờ duyệt lại, course giữ nguyên trạng thái.
    // Admin có toàn quyền: sửa trực tiếp mọi trạng thái (không cần change request).
    const requiresChangeRequest =
      course.status === CourseStatus.PUBLISH ||
      course.status === CourseStatus.APPROVED;
    if (requiresChangeRequest && !isAdmin) {
      const prevData = this.snapshotPreviousData(course, payload);
      // Overwrite chỉ áp dụng cho request course.update (tối đa 1 pending/course).
      // Lesson change requests stack riêng theo từng thao tác nên không đụng vào.
      const existing = await this.courseChangeRequestModel.findOne({
        where: {
          courseId: id,
          status: CourseChangeRequestStatus.PENDING,
          kind: CourseChangeRequestKind.COURSE_UPDATE,
        },
      });
      if (existing) {
        return await existing.update({
          payload,
          prevData,
          requestedBy: requester.userId,
        });
      }
      return await this.courseChangeRequestModel.create({
        courseId: id,
        requestedBy: requester.userId,
        payload,
        prevData,
        kind: CourseChangeRequestKind.COURSE_UPDATE,
        status: CourseChangeRequestStatus.PENDING,
      });
    }

    // Sửa trực tiếp (admin mọi trạng thái, hoặc non-admin trên khóa chưa khóa nội
    // dung) → GIỮ NGUYÊN status hiện tại, không ép về DRAFT. Status nào giữ status đó.
    const wasPublished = course.status === CourseStatus.PUBLISH;
    const updated = await course.update({ ...payload });

    // Admin sửa trực tiếp course ĐÃ publish (không qua change request) → vẫn phải
    // báo học viên đã enroll + chủ khóa (nếu admin sửa hộ). Course chưa publish
    // chưa có học viên nên bỏ qua. Best-effort, không phá luồng update.
    if (wasPublished) {
      await this.notifyDirectCourseChange(
        updated,
        CourseChangeRequestKind.COURSE_UPDATE,
        requester.userId,
      );
    }

    return updated;
  }

  /**
   * Public: gọi từ LessonsService khi admin sửa/thêm/xóa lesson TRỰC TIẾP (bypass
   * change request) trên một khóa đã publish. Tự load course; no-op nếu course
   * không tồn tại hoặc chưa publish (chưa có học viên). Best-effort.
   */
  async notifyLessonChangeDirect(
    courseId: number,
    kind: CourseChangeRequestKind,
    editorUserId?: number,
  ): Promise<void> {
    const course = await this.courseModel.findByPk(courseId, {
      attributes: ['id', 'name', 'userId', 'status'],
    });
    if (!course || course.status !== CourseStatus.PUBLISH) {
      return;
    }
    await this.notifyDirectCourseChange(course, kind, editorUserId);
  }

  /**
   * Gửi notification khi nội dung một course ĐÃ publish bị sửa trực tiếp (admin
   * bypass change request): học viên đang theo học nhận `course.updated` (copy
   * tùy `kind`); chủ khóa nhận báo nếu người sửa không phải chính họ. Best-effort
   * qua media_service.
   */
  private async notifyDirectCourseChange(
    course: Course,
    kind: CourseChangeRequestKind,
    editorUserId?: number,
  ): Promise<void> {
    try {
      const courseId = course.id;
      const courseName =
        (course as Course & { name?: string }).name ?? 'khóa học';
      const redirectUrl = `/courses/${courseId}`;
      const ownerId = (course as Course & { userId?: number }).userId;
      const items: InternalNotificationItem[] = [];

      // Chủ khóa học (khi admin sửa hộ — người sửa khác chủ khóa).
      if (ownerId && ownerId !== editorUserId) {
        const ownerCopy = this.buildOwnerDirectChangeCopy(kind, courseName);
        items.push({
          userId: ownerId,
          eventType: COURSE_UPDATED_EVENT,
          sseEventType: NOTIFY_CREATED_SSE_EVENT,
          title: ownerCopy.title,
          message: ownerCopy.message,
          payload: { courseId, kind, redirectUrl },
          sourceType: COURSE_SOURCE,
          sourceId: courseId,
        });
      }

      // Học viên còn theo học (loại trừ chủ khóa + người sửa để tránh trùng).
      const enrolls = await this.enrollModel.findAll({
        where: {
          courseId,
          status: { [Op.in]: [EnrollStatus.ACTIVE, EnrollStatus.COMPLETED] },
        },
        attributes: ['userId'],
      });
      const { title, message } = this.buildStudentUpdateCopy(kind, courseName);
      const notifiedStudents = new Set<number>();
      for (const enroll of enrolls) {
        const studentId = enroll.userId;
        if (
          studentId === ownerId ||
          studentId === editorUserId ||
          notifiedStudents.has(studentId)
        ) {
          continue;
        }
        notifiedStudents.add(studentId);
        items.push({
          userId: studentId,
          eventType: COURSE_UPDATED_EVENT,
          sseEventType: NOTIFY_CREATED_SSE_EVENT,
          title,
          message,
          payload: { courseId, kind, redirectUrl },
          sourceType: COURSE_SOURCE,
          sourceId: courseId,
        });
      }

      await this.dispatchInternalNotifications(items);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[courses] failed to notify direct course update', err);
    }
  }

  /**
   * Tạo một lesson change request `pending` (gọi từ LessonsService khi course
   * đã publish).
   *
   * - `lesson.create`: luôn tạo request mới (chưa có lesson đích để gom nhóm).
   * - `lesson.update` / `lesson.delete`: GHI ĐÈ request pending cùng `(kind,
   *   targetId)` nếu có — tránh stack nhiều request trùng thao tác trên cùng một
   *   lesson, vốn sẽ bị admin áp dụng lặp lại (lần sau có thể ghi đè bằng payload
   *   cũ hơn). Tối đa 1 pending mỗi (kind, lesson).
   */
  async createLessonChangeRequest(params: {
    kind: CourseChangeRequestKind;
    courseId: number;
    targetId: number | null;
    payload: LessonChangePayload;
    prevData: LessonChangePayload | null;
    requestedBy: number;
  }): Promise<CourseChangeRequest> {
    if (params.targetId !== null) {
      const existing = await this.courseChangeRequestModel.findOne({
        where: {
          courseId: params.courseId,
          kind: params.kind,
          targetId: params.targetId,
          status: CourseChangeRequestStatus.PENDING,
        },
      });
      if (existing) {
        return await existing.update({
          payload: params.payload,
          prevData: params.prevData,
          requestedBy: params.requestedBy,
        });
      }
    }

    return await this.courseChangeRequestModel.create({
      courseId: params.courseId,
      requestedBy: params.requestedBy,
      payload: params.payload,
      prevData: params.prevData,
      kind: params.kind,
      targetId: params.targetId,
      status: CourseChangeRequestStatus.PENDING,
    });
  }

  /**
   * Resolve khóa học chứa một lessonActivity: quiz → lessonActivity → lesson →
   * course. Trả `null` nếu bất kỳ mắt xích nào không tồn tại. Dùng cho
   * QuizzesService quyết định một thao tác quiz có cần đi qua change request hay
   * không (course đã publish?) và ai là chủ khóa.
   */
  async findCourseByLessonActivityId(
    lessonActivityId: number,
  ): Promise<Course | null> {
    const activity = await this.lessonActivityModel.findByPk(lessonActivityId, {
      attributes: ['id', 'lessonId'],
    });
    if (!activity?.lessonId) return null;
    const lesson = await this.lessonModel.findByPk(activity.lessonId, {
      attributes: ['id', 'courseId'],
    });
    if (!lesson?.courseId) return null;
    return await this.courseModel.findByPk(lesson.courseId);
  }

  /**
   * Public: gọi từ QuizzesService khi admin sửa/thêm/xóa quiz TRỰC TIẾP (bypass
   * change request) trên một khóa đã publish. No-op nếu course không tồn tại
   * hoặc chưa publish. Best-effort.
   */
  async notifyQuizChangeDirect(
    courseId: number,
    kind: CourseChangeRequestKind,
    editorUserId?: number,
  ): Promise<void> {
    const course = await this.courseModel.findByPk(courseId, {
      attributes: ['id', 'name', 'userId', 'status'],
    });
    if (!course || course.status !== CourseStatus.PUBLISH) {
      return;
    }
    await this.notifyDirectCourseChange(course, kind, editorUserId);
  }

  /**
   * Dọn các pending request trỏ tới một quiz (quiz.update / quiz.delete) khi quiz
   * đó bị xoá — tránh request mồ côi không áp dụng được. `exceptRequestId` chừa
   * lại chính request đang duyệt.
   */
  private async purgeQuizChangeRequests(
    quizId: number,
    options: { exceptRequestId?: number; transaction?: Transaction } = {},
  ): Promise<void> {
    const where: WhereOptions = {
      targetId: quizId,
      status: CourseChangeRequestStatus.PENDING,
      kind: {
        [Op.in]: [
          CourseChangeRequestKind.QUIZ_UPDATE,
          CourseChangeRequestKind.QUIZ_DELETE,
        ],
      },
    };
    if (options.exceptRequestId) {
      where.id = { [Op.ne]: options.exceptRequestId };
    }
    await this.courseChangeRequestModel.destroy({
      where,
      transaction: options.transaction,
    });
  }

  /** Danh sách change request (admin), filter theo status + phân trang server-side. */
  async getCourseStatusStats(): Promise<{
    pending: number;
    approved: number;
    rejected: number;
  }> {
    const results = await this.courseModel.findAll({
      attributes: ['status', [fn('COUNT', col('id')), 'count']],
      where: {
        status: {
          [Op.in]: [
            CourseStatus.PENDING,
            CourseStatus.APPROVED,
            CourseStatus.REJECTED,
          ],
        },
      },
      group: ['status'],
      raw: true,
    });
    const map: Record<string, number> = {};
    for (const row of results as unknown as { status: string; count: string }[]) {
      map[row.status] = Number(row.count);
    }
    return {
      pending: map[CourseStatus.PENDING] ?? 0,
      approved: map[CourseStatus.APPROVED] ?? 0,
      rejected: map[CourseStatus.REJECTED] ?? 0,
    };
  }

  async getChangeRequestStatusStats(): Promise<{
    pending: number;
    approved: number;
    rejected: number;
  }> {
    const results = await this.courseChangeRequestModel.findAll({
      attributes: ['status', [fn('COUNT', col('id')), 'count']],
      group: ['status'],
      raw: true,
    });
    const map: Record<string, number> = {};
    for (const row of results as unknown as { status: string; count: string }[]) {
      map[row.status] = Number(row.count);
    }
    return {
      pending: map[CourseChangeRequestStatus.PENDING] ?? 0,
      approved: map[CourseChangeRequestStatus.APPROVED] ?? 0,
      rejected: map[CourseChangeRequestStatus.REJECTED] ?? 0,
    };
  }

  private readonly changeRequestIncludes = [
    {
      model: Course,
      as: 'course',
      attributes: ['id', 'name', 'status'],
      required: false,
    },
    {
      model: User,
      as: 'requester',
      attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl'],
      required: false,
    },
  ];

  async listChangeRequests(params: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    data: CourseChangeRequestView[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = this.parsePositiveInteger(params.page, 1);
    const limit = this.parsePositiveInteger(params.limit, 20, 100);

    const where: WhereOptions = {};
    if (params.status) {
      where.status = params.status;
    }

    const { rows, count } = await this.courseChangeRequestModel.findAndCountAll(
      {
        where,
        include: this.changeRequestIncludes,
        order: [['id', 'DESC']],
        limit,
        offset: (page - 1) * limit,
      },
    );

    return {
      data: rows.map((row) => this.toChangeRequestView(row)),
      total: count,
      page,
      limit,
    };
  }

  async getChangeRequest(id: number): Promise<CourseChangeRequestView> {
    const request = await this.courseChangeRequestModel.findByPk(id, {
      include: this.changeRequestIncludes,
    });
    if (!request) {
      throw new NotFoundException(`Change request ${id} not found`);
    }
    return this.toChangeRequestView(request);
  }

  /**
   * Admin duyệt change request. `approved` → apply payload vào course
   * (giữ nguyên `PUBLISH`) + ghi audit log; `rejected` → course không đổi.
   */
  async reviewChangeRequest(
    requestId: number,
    decision: 'approved' | 'rejected',
    requester: RequesterContext,
    note?: string,
  ): Promise<{
    changeRequest: CourseChangeRequestView;
    course: Course | null;
  }> {
    const request = await this.courseChangeRequestModel.findByPk(requestId);
    if (!request) {
      throw new NotFoundException(`Change request ${requestId} not found`);
    }
    if (request.status !== CourseChangeRequestStatus.PENDING) {
      throw new ConflictException('Change request is no longer pending');
    }

    if (decision === 'rejected') {
      const rejected = await request.update({
        status: CourseChangeRequestStatus.REJECTED,
        reviewedBy: requester.userId,
        reviewNote: note ?? null,
      });

      await this.auditLogsService.log({
        actorUserId: requester.userId,
        actorRole: requester.role,
        action: 'course.change_request.reject',
        targetType:
          request.kind === CourseChangeRequestKind.COURSE_UPDATE
            ? 'course'
            : 'lesson',
        targetId: request.targetId ?? request.courseId,
        metadata: {
          changeRequestId: requestId,
          kind: request.kind,
          courseId: request.courseId,
        },
        ip: requester.ip ?? null,
        userAgent: requester.userAgent ?? null,
      });

      // Báo cho giảng viên biết request đã bị từ chối (best-effort).
      await this.notifyChangeRequestRejected(rejected, note);

      return {
        changeRequest: this.toChangeRequestView(rejected),
        course: null,
      };
    }

    // Quiz change requests đi theo nhánh riêng (replay qua QuizzesService).
    if (this.isQuizKind(request.kind)) {
      return await this.approveQuizChangeRequest(request, requester, note);
    }

    // Lesson change requests đi theo nhánh riêng (áp dụng lên bảng lessons +
    // đồng bộ duration/progress). `kind` null = row cũ → course.update.
    if (
      request.kind &&
      request.kind !== CourseChangeRequestKind.COURSE_UPDATE
    ) {
      return await this.approveLessonChangeRequest(request, requester, note);
    }

    const course = await this.findOne(request.courseId);
    const before = this.auditableCourseSnapshot(course);
    // Làm tươi snapshot ngay trước khi apply để diff phản ánh đúng giá trị
    // course tại thời điểm duyệt (đề phòng đã đổi so với lúc tạo request).
    const prevData = this.snapshotPreviousData(course, request.payload);
    const updatedCourse = await course.update(request.payload);
    const approved = await request.update({
      prevData,
      status: CourseChangeRequestStatus.APPROVED,
      reviewedBy: requester.userId,
      reviewNote: note ?? null,
    });

    await this.auditLogsService.log({
      actorUserId: requester.userId,
      actorRole: requester.role,
      action: 'course.change_request.approve',
      targetType: 'course',
      targetId: course.id,
      before,
      after: this.auditableCourseSnapshot(updatedCourse),
      metadata: { changeRequestId: requestId },
      ip: requester.ip ?? null,
      userAgent: requester.userAgent ?? null,
    });

    // Lưu noti + bắn SSE cho giảng viên và học viên (best-effort).
    await this.notifyChangeRequestApproved(updatedCourse, approved);

    return {
      changeRequest: this.toChangeRequestView(approved),
      course: updatedCourse,
    };
  }

  /** Ảnh chụp giá trị lesson hiện tại cho đúng các field có trong `payload`. */
  private snapshotLesson(
    lesson: Lesson,
    payload: LessonChangePayload,
  ): LessonChangePayload {
    const snapshot: Record<string, unknown> = {};
    for (const key of Object.keys(payload)) {
      snapshot[key] = lesson.get(key as keyof Lesson) ?? null;
    }
    return snapshot as LessonChangePayload;
  }

  /**
   * Áp dụng thay đổi lesson của một change request đã duyệt vào bảng `lessons`.
   * Trả về ảnh chụp giá trị CŨ (tươi tại thời điểm duyệt) cho các field trong
   * payload để admin thấy đúng diff; `null` với `lesson.create` (chưa có giá trị cũ).
   */
  private async applyLessonChange(
    request: CourseChangeRequest,
    transaction: Transaction,
  ): Promise<LessonChangePayload | null> {
    if (request.kind === CourseChangeRequestKind.LESSON_CREATE) {
      await this.lessonModel.create(
        {
          ...(request.payload as LessonChangePayload),
          courseId: request.courseId,
        },
        { transaction },
      );
      return null;
    }

    if (!request.targetId) {
      throw new BadRequestException(
        'Lesson change request is missing the target lesson id',
      );
    }

    const lesson = await this.lessonModel.findByPk(request.targetId, {
      transaction,
    });
    if (!lesson || lesson.status === LessonStatus.REMOVED) {
      throw new NotFoundException(
        `Lesson with ID ${request.targetId} not found`,
      );
    }

    const payload = request.payload as LessonChangePayload;
    // Refresh snapshot ngay trước khi apply để diff phản ánh đúng giá trị lesson
    // tại thời điểm duyệt (đề phòng lesson đã đổi so với lúc tạo request).
    const prevData = this.snapshotLesson(lesson, payload);

    if (request.kind === CourseChangeRequestKind.LESSON_DELETE) {
      await lesson.update({ status: LessonStatus.REMOVED }, { transaction });
      // Lesson đã bị xoá → dọn các pending request khác trỏ tới nó (giữ lại
      // chính request đang duyệt để còn cập nhật status = approved).
      await this.purgeLessonChangeRequests(lesson.id, {
        exceptRequestId: request.id,
        transaction,
      });
    } else {
      await lesson.update(payload, { transaction });
    }

    return prevData;
  }

  /**
   * Duyệt một lesson change request: áp thay đổi vào bảng `lessons` + đánh dấu
   * request approved trong cùng transaction; sau khi commit mới đồng bộ duration
   * và tiến độ enrollees (reconcile dùng transaction riêng nên phải chạy sau).
   */
  private async approveLessonChangeRequest(
    request: CourseChangeRequest,
    requester: RequesterContext,
    note?: string,
  ): Promise<{
    changeRequest: CourseChangeRequestView;
    course: Course | null;
  }> {
    // Đảm bảo course tồn tại trước khi áp dụng.
    const course = await this.findOne(request.courseId);

    let approved!: CourseChangeRequest;
    await this.sequelize.transaction(async (transaction) => {
      const prevData = await this.applyLessonChange(request, transaction);
      approved = await request.update(
        {
          // Giữ prevData cũ cho lesson.create (null); cập nhật snapshot tươi cho
          // lesson.update / lesson.delete.
          ...(prevData !== null ? { prevData } : {}),
          status: CourseChangeRequestStatus.APPROVED,
          reviewedBy: requester.userId,
          reviewNote: note ?? null,
        },
        { transaction },
      );
    });

    await this.syncCourseDuration(request.courseId);
    await this.enrollsService.reconcileCourseEnrollProgress(request.courseId);

    await this.auditLogsService.log({
      actorUserId: requester.userId,
      actorRole: requester.role,
      action: 'course.change_request.approve',
      targetType: 'lesson',
      targetId: request.targetId ?? course.id,
      metadata: {
        changeRequestId: request.id,
        kind: request.kind,
        courseId: course.id,
      },
      ip: requester.ip ?? null,
      userAgent: requester.userAgent ?? null,
    });

    // Lưu noti + bắn SSE cho giảng viên và học viên (best-effort).
    // Dùng `course` (đã load trước khi đổi) vì name/userId không bị lesson edit
    // làm thay đổi.
    await this.notifyChangeRequestApproved(course, approved);

    return {
      changeRequest: this.toChangeRequestView(approved),
      // Trả về course đã refresh kèm danh sách lesson mới nhất cho FE.
      course: await this.findOne(request.courseId),
    };
  }

  /** true nếu `kind` là một thao tác quiz (quiz.create / update / delete). */
  private isQuizKind(kind?: CourseChangeRequestKind | null): boolean {
    return (
      kind === CourseChangeRequestKind.QUIZ_CREATE ||
      kind === CourseChangeRequestKind.QUIZ_UPDATE ||
      kind === CourseChangeRequestKind.QUIZ_DELETE
    );
  }

  /**
   * Duyệt một quiz change request: replay thao tác qua QuizzesService (create /
   * update / remove primitives — không kèm permission/published check), đánh dấu
   * approved, ghi audit + gửi noti. Với quiz.delete: dọn các pending request
   * khác trỏ tới quiz vừa xoá.
   */
  private async approveQuizChangeRequest(
    request: CourseChangeRequest,
    requester: RequesterContext,
    note?: string,
  ): Promise<{
    changeRequest: CourseChangeRequestView;
    course: Course | null;
  }> {
    // Đảm bảo course tồn tại trước khi áp dụng.
    const course = await this.findOne(request.courseId);

    await this.quizzesService.applyApprovedQuizChange(request);

    if (
      request.kind === CourseChangeRequestKind.QUIZ_DELETE &&
      request.targetId
    ) {
      await this.purgeQuizChangeRequests(request.targetId, {
        exceptRequestId: request.id,
      });
    }

    const approved = await request.update({
      status: CourseChangeRequestStatus.APPROVED,
      reviewedBy: requester.userId,
      reviewNote: note ?? null,
    });

    await this.auditLogsService.log({
      actorUserId: requester.userId,
      actorRole: requester.role,
      action: 'course.change_request.approve',
      targetType: 'quiz',
      targetId: request.targetId ?? course.id,
      metadata: {
        changeRequestId: request.id,
        kind: request.kind,
        courseId: course.id,
      },
      ip: requester.ip ?? null,
      userAgent: requester.userAgent ?? null,
    });

    // Lưu noti + bắn SSE cho giảng viên và học viên (best-effort). Dùng `course`
    // đã load trước vì name/userId không bị quiz edit làm thay đổi.
    await this.notifyChangeRequestApproved(course, approved);

    return {
      changeRequest: this.toChangeRequestView(approved),
      course: await this.findOne(request.courseId),
    };
  }

  async remove(id: number, requester?: RequesterContext): Promise<void> {
    const course = await this.findOne(id);
    if (requester) {
      const isAdmin = requester.role === this.ADMIN_ROLE;
      const ownerId = (course as Course & { userId?: number }).userId;
      if (!isAdmin && ownerId !== requester.userId) {
        throw new ForbiddenException('You are not the owner of this course');
      }
    }
    const before = this.auditableCourseSnapshot(course);
    // Course bị xoá (soft delete) → chỉ xoá các change request ĐANG PENDING của
    // nó (không còn ý nghĩa gửi admin duyệt). Request đã approved/rejected GIỮ LẠI
    // làm lịch sử — không cascade.
    await this.courseChangeRequestModel.destroy({
      where: { courseId: id, status: CourseChangeRequestStatus.PENDING },
    });
    // course.destroy() giờ là soft delete (paranoid) → set deleted_at.
    await course.destroy();

    if (requester) {
      await this.auditLogsService.log({
        actorUserId: requester.userId,
        actorRole: requester.role,
        action: 'course.delete',
        targetType: 'course',
        targetId: id,
        before,
        ip: requester.ip ?? null,
        userAgent: requester.userAgent ?? null,
      });
    }
  }

  private parseTimeToMilliseconds(value: string | null | undefined): number {
    if (!value) return 0;

    const match = value.match(/^(\d+):([0-5]\d):([0-5]\d)(?:\.(\d{1,3}))?$/);
    if (!match) return 0;

    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    const seconds = Number(match[3]);
    const milliseconds = Number((match[4] ?? '0').padEnd(3, '0'));

    return ((hours * 60 + minutes) * 60 + seconds) * 1000 + milliseconds;
  }

  private formatMillisecondsToTime(value: number): string {
    const safeValue =
      Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
    const totalSeconds = Math.floor(safeValue / 1000);
    const milliseconds = safeValue % 1000;

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`;
  }

  async syncCourseDuration(courseId: number): Promise<void> {
    // Sum duration of all non-removed lessons belonging to this course
    const lessons = await this.lessonModel.findAll({
      where: {
        courseId,
        status: { [Op.ne]: LessonStatus.REMOVED },
      },
      attributes: ['duration'],
    });
    const totalMilliseconds = lessons.reduce(
      (sum, lesson) => sum + this.parseTimeToMilliseconds(lesson.duration),
      0,
    );
    console.log(
      `Syncing course ${courseId} duration, found ${lessons.length} lessons, total duration: ${totalMilliseconds}ms`,
    );
    const formatted = this.formatMillisecondsToTime(totalMilliseconds);

    // Update course duration
    await this.courseModel.update(
      { duration: formatted },
      { where: { id: courseId } },
    );
  }

  private async ensureCourseHasLessons(courseId: number): Promise<void> {
    const lessonCount = await this.lessonModel.count({
      where: {
        courseId,
        status: { [Op.ne]: LessonStatus.REMOVED },
      },
    });

    if (lessonCount === 0) {
      throw new BadRequestException(
        'Khóa học cần có ít nhất một bài học trước khi gửi duyệt.',
      );
    }
  }

  async submitForReview(
    id: number,
    requester?: RequesterContext,
  ): Promise<Course> {
    const course = await this.findOne(id);
    if (requester && requester.role !== this.ADMIN_ROLE) {
      const ownerId = (course as Course & { userId?: number }).userId;
      if (ownerId !== requester.userId) {
        throw new ForbiddenException('You are not the owner of this course');
      }
    }
    await this.ensureCourseHasLessons(id);
    if (course.status !== CourseStatus.DRAFT) {
      throw new BadRequestException(
        `Chỉ có thể gửi duyệt khóa học ở trạng thái bản nháp. Trạng thái hiện tại: ${course.status}`,
      );
    }
    return await course.update({ status: CourseStatus.PENDING });
  }

  async review(
    id: number,
    status: 'accepted' | 'rejected',
    requester?: RequesterContext,
  ): Promise<Course> {
    const course = await this.findOne(id);
    await this.ensureCourseHasLessons(id);
    if (course.status !== CourseStatus.PENDING) {
      throw new BadRequestException(
        `Course must be in PENDING status to review. Current status: ${course.status}`,
      );
    }

    const before = this.auditableCourseSnapshot(course);
    const newStatus =
      status === 'accepted' ? CourseStatus.APPROVED : CourseStatus.REJECTED;
    const updated = await course.update({ status: newStatus });

    if (requester) {
      await this.auditLogsService.log({
        actorUserId: requester.userId,
        actorRole: requester.role,
        action: 'course.review',
        targetType: 'course',
        targetId: id,
        before,
        after: this.auditableCourseSnapshot(updated),
        metadata: { decision: status },
        ip: requester.ip ?? null,
        userAgent: requester.userAgent ?? null,
      });
    }

    return updated;
  }

  async publish(id: number, requester?: RequesterContext): Promise<Course> {
    const course = await this.findOne(id);
    if (course.status !== CourseStatus.APPROVED) {
      throw new BadRequestException(
        `Course must be in APPROVED status to publish. Current status: ${course.status}`,
      );
    }

    // Check ownership for LECTURER
    const isAdmin = requester?.role === 1;
    if (requester && !isAdmin && course.userId !== requester.userId) {
      throw new ForbiddenException(
        'You do not have permission to publish this course',
      );
    }

    const before = this.auditableCourseSnapshot(course);
    const updated = await course.update({ status: CourseStatus.PUBLISH });

    // Publish course → publish luôn các quiz activity còn draft (draft → public)
    // để học viên nộp bài được. Activity đã archived/removed/public giữ nguyên.
    const lessonRows = await this.lessonModel.findAll({
      where: { courseId: id },
      attributes: ['id'],
    });
    const lessonIds = lessonRows.map((l) => l.id);
    if (lessonIds.length) {
      await this.lessonActivityModel.update(
        { status: ActivityStatus.PUBLIC },
        {
          where: {
            lessonId: { [Op.in]: lessonIds },
            activityType: ActivityType.QUIZ,
            status: ActivityStatus.DRAFT,
          },
        },
      );
    }

    if (requester) {
      await this.auditLogsService.log({
        actorUserId: requester.userId,
        actorRole: requester.role,
        action: 'course.publish',
        targetType: 'course',
        targetId: id,
        before,
        after: this.auditableCourseSnapshot(updated),
        ip: requester.ip ?? null,
        userAgent: requester.userAgent ?? null,
      });
    }

    // BE-07: notify followers (best-effort).
    await this.notifyFollowersOfNewCourse(updated);

    return updated;
  }
}
