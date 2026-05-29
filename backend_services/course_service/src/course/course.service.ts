import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Includeable, Order } from 'sequelize';
import { col, fn, literal, Op } from 'sequelize';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { Course, CourseStatus } from 'src/models/course.model';
import { Lesson, LessonStatus } from 'src/models/lesson.model';
import { LessonActivity, ActivityStatus } from 'src/models/lesson-activity.model';
import { Quiz } from 'src/models/quiz.model';
import { QuizQuestion } from 'src/models/quiz-question.model';
import { QuizOption } from 'src/models/quiz-option.model';
import { Enroll, EnrollStatus } from 'src/models/enroll.model';
import { Feedback } from 'src/models/feedback.model';
import { Video } from 'src/models/video.model';
import { User } from 'src/users/user.model';
import { AuditLogsService } from 'src/audit_logs/audit-logs.service';
import { RequesterContext } from 'src/audit_logs/requester.types';

export type CoursePublicSort = 'newest' | 'popular' | 'rating';

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
    @InjectModel(Feedback)
    private readonly feedbackModel: typeof Feedback,
    private readonly auditLogsService: AuditLogsService,
  ) { }

  private auditableCourseSnapshot(course: Course) {
    return {
      id: course.id,
      name: (course as Course & { name?: string }).name ?? null,
      status: course.status,
      userId: (course as Course & { userId?: number }).userId ?? null,
    };
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
        return [[literal('enrolled_count'), 'DESC'], ['id', 'DESC']] as Order;
      case 'rating':
        return [[literal('avg_rating'), 'DESC'], ['id', 'DESC']] as Order;
      case 'newest':
      default:
        return [['id', 'DESC']];
    }
  }

  private async validateVideoId(videoId: number | null | undefined): Promise<void> {
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

  async create(createCourseDto: CreateCourseDto, userId: number | undefined): Promise<Course> {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    await this.validateVideoId(createCourseDto.videoId);

    const createdCourse = await this.courseModel.create({
      ...createCourseDto,
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
    status?: CourseStatus,
    page?: number,
    limit?: number,
    sort?: CoursePublicSort,
    search?: string,
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
    const whereCondition: any = {};

    if (status) {
      whereCondition.status = status;
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

  async findOne(id: number): Promise<Course> {
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

    throw new ForbiddenException('You are not allowed to access this course statistics');
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
        attributes: [
          'rating',
          [fn('COUNT', col('id')), 'count'],
        ],
        group: ['rating'],
        raw: true,
      }),
    ]);

    const averageProgress = this.parseNumberValue(
      (averageProgressRow as { averageProgress?: unknown } | null)?.averageProgress,
    );
    const averageRating = this.parseNumberValue(
      (averageRatingRow as { averageRating?: unknown } | null)?.averageRating,
    );
    const completionRate =
      totalEnrollments > 0 ? (completedEnrollments / totalEnrollments) * 100 : 0;

    const ratingRowsData = ratingRows as unknown as Array<{ rating: unknown; count: unknown }>;
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
    if (requesterRole !== this.ADMIN_ROLE && requesterRole !== this.LECTURER_ROLE) {
      throw new ForbiddenException('You are not allowed to access course statistics');
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
              literal(`CASE WHEN status = '${EnrollStatus.ACTIVE}' THEN 1 ELSE 0 END`),
            ),
            'activeEnrollments',
          ],
          [
            fn(
              'SUM',
              literal(`CASE WHEN status = '${EnrollStatus.COMPLETED}' THEN 1 ELSE 0 END`),
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

    const enrollAggMap = new Map<number, {
      totalEnrollments: number;
      activeEnrollments: number;
      completedEnrollments: number;
      averageProgress: number;
    }>();
    const enrollAggRowsData = enrollAggRows as unknown as Array<Record<string, unknown>>;
    for (const row of enrollAggRowsData) {
      const courseId = this.parseNumberValue(row.courseId);
      enrollAggMap.set(courseId, {
        totalEnrollments: this.parseNumberValue(row.totalEnrollments),
        activeEnrollments: this.parseNumberValue(row.activeEnrollments),
        completedEnrollments: this.parseNumberValue(row.completedEnrollments),
        averageProgress: this.parseNumberValue(row.averageProgress),
      });
    }

    const ratingAggMap = new Map<number, {
      totalReviews: number;
      averageRating: number;
    }>();
    const ratingAggRowsData = ratingAggRows as unknown as Array<Record<string, unknown>>;
    for (const row of ratingAggRowsData) {
      const courseId = this.parseNumberValue(row.courseId);
      ratingAggMap.set(courseId, {
        totalReviews: this.parseNumberValue(row.totalReviews),
        averageRating: this.parseNumberValue(row.averageRating),
      });
    }

    const courseItems = courses.map((course) => {
      const courseId = this.parseNumberValue(course.id);
      const enrollAgg =
        enrollAggMap.get(courseId) ??
        {
          totalEnrollments: 0,
          activeEnrollments: 0,
          completedEnrollments: 0,
          averageProgress: 0,
        };
      const ratingAgg = ratingAggMap.get(courseId) ?? { totalReviews: 0, averageRating: 0 };
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
        acc.progressWeightedSum += item.enrollment.averageProgress * item.enrollment.total;
        acc.ratingWeightedSum += item.ratings.averageRating * item.ratings.totalReviews;
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
      summary.totalReviews > 0 ? summary.ratingWeightedSum / summary.totalReviews : 0;

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

  async update(id: number, updateCourseDto: UpdateCourseDto): Promise<Course> {
    const course = await this.findOne(id);
    if (course.status === CourseStatus.PUBLISH) {
      throw new BadRequestException(
        'Cannot edit a published course. Only quiz edits are allowed after publishing.',
      );
    }
    await this.validateVideoId(updateCourseDto.videoId);
    return await course.update({ ...updateCourseDto, status: CourseStatus.DRAFT });
  }

  async remove(id: number, requester?: RequesterContext): Promise<void> {
    const course = await this.findOne(id);
    const before = this.auditableCourseSnapshot(course);
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

    return (((hours * 60 + minutes) * 60 + seconds) * 1000) + milliseconds;
  }

  private formatMillisecondsToTime(value: number): string {
    const safeValue = Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
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
        'Course must have at least one lesson before requesting review.',
      );
    }
  }

  async submitForReview(id: number): Promise<Course> {
    const course = await this.findOne(id);
    await this.ensureCourseHasLessons(id);
    if (course.status !== CourseStatus.DRAFT) {
      throw new BadRequestException(
        `Course must be in DRAFT status to submit for review. Current status: ${course.status}`,
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

    const before = this.auditableCourseSnapshot(course);
    const updated = await course.update({ status: CourseStatus.PUBLISH });

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

    return updated;
  }
}
