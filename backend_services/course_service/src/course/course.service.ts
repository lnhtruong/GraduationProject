import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { col, fn, literal, Op } from 'sequelize';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { Course, CourseStatus } from 'src/models/course.model';
import { Lesson, LessonStatus } from 'src/models/lesson.model';
import { Enroll, EnrollStatus } from 'src/models/enroll.model';
import { Feedback } from 'src/models/feedback.model';

@Injectable()
export class CoursesService {
  constructor(
    @InjectModel(Course)
    private readonly courseModel: typeof Course,
    @InjectModel(Lesson)
    private readonly lessonModel: typeof Lesson,
    @InjectModel(Enroll)
    private readonly enrollModel: typeof Enroll,
    @InjectModel(Feedback)
    private readonly feedbackModel: typeof Feedback,
  ) {}

  private readonly ADMIN_ROLE = 1;
  private readonly LECTURER_ROLE = 3;

  async create(createCourseDto: CreateCourseDto, userId: number | undefined): Promise<Course> {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }
    return await this.courseModel.create({
      ...createCourseDto,
      userId: userId,
      level: createCourseDto.level ?? undefined,
      status: CourseStatus.DRAFT,
      duration: '00:00:00.000',
    });
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
      return await this.courseModel.findAll({ where: whereCondition });
    }

    const safePage = Number.isInteger(page) && page! > 0 ? page! : 1;
    const safeLimit =
      Number.isInteger(limit) && limit! > 0 ? Math.min(limit!, 100) : 10;
    const offset = (safePage - 1) * safeLimit;

    const { rows, count } = await this.courseModel.findAndCountAll({
      where: whereCondition,
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

    const shouldPaginate = page !== undefined || limit !== undefined;

    if (!shouldPaginate) {
      return await this.courseModel.findAll({ where: whereCondition });
    }

    const safePage = Number.isInteger(page) && page! > 0 ? page! : 1;
    const safeLimit =
      Number.isInteger(limit) && limit! > 0 ? Math.min(limit!, 100) : 10;
    const offset = (safePage - 1) * safeLimit;

    const { rows, count } = await this.courseModel.findAndCountAll({
      where: whereCondition,
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

  async findOne(id: number): Promise<Course> {
    const course = await this.courseModel.findByPk(id);
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
    return await course.update({ ...updateCourseDto, status: CourseStatus.DRAFT });
  }

  async remove(id: number): Promise<void> {
    const course = await this.findOne(id);
    await course.destroy();
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
  ): Promise<Course> {
    const course = await this.findOne(id);
    await this.ensureCourseHasLessons(id);
    if (course.status !== CourseStatus.PENDING) {
      throw new BadRequestException(
        `Course must be in PENDING status to review. Current status: ${course.status}`,
      );
    }

    const newStatus =
      status === 'accepted' ? CourseStatus.APPROVED : CourseStatus.REJECTED;
    return await course.update({ status: newStatus });
  }

  async publish(id: number): Promise<Course> {
    const course = await this.findOne(id);
    if (course.status !== CourseStatus.APPROVED) {
      throw new BadRequestException(
        `Course must be in APPROVED status to publish. Current status: ${course.status}`,
      );
    }
    return await course.update({ status: CourseStatus.PUBLISH });
  }
}