import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { Course, CourseStatus } from 'src/models/course.model';
import { Lesson, LessonStatus } from 'src/models/lesson.model';

@Injectable()
export class CoursesService {
  constructor(
    @InjectModel(Course)
    private readonly courseModel: typeof Course,
     @InjectModel(Lesson)
    private readonly lessonModel: typeof Lesson,
  ) {}

  async create(createCourseDto: CreateCourseDto, userId: number | undefined): Promise<Course> {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }
    return await this.courseModel.create({
      ...createCourseDto,
      userId: userId,
      level: createCourseDto.level ?? undefined,
      status: CourseStatus.DRAFT,
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
    } else {
      whereCondition.status = {
        [Op.ne]: CourseStatus.REJECTED,
      };
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

  async update(id: number, updateCourseDto: UpdateCourseDto): Promise<Course> {
    const course = await this.findOne(id);
    return await course.update(updateCourseDto);
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