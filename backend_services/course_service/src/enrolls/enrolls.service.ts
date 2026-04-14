import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { Op, Transaction } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Course } from 'src/models/course.model';
import { Enroll, EnrollStatus } from 'src/models/enroll.model';
import { LessonProgress, LessonProgressStatus } from 'src/models/lesson-progress.model';
import { Lesson, LessonStatus } from 'src/models/lesson.model';
import { CreateEnrollDto } from './dto/create-enroll.dto';
import { UpdateEnrollDto } from './dto/update-enroll.dto';
import { GetEnrollsQueryDto } from './dto/get-enrolls-query.dto';
import { PaginationMetaDto, PaginatedResponseDto } from 'src/models/pagination.dto';

@Injectable()
export class EnrollsService {
  constructor(
    @InjectConnection()
    private readonly sequelize: Sequelize,
    @InjectModel(Enroll)
    private readonly enrollModel: typeof Enroll,
    @InjectModel(Course)
    private readonly courseModel: typeof Course,
    @InjectModel(LessonProgress)
    private readonly lessonProgressModel: typeof LessonProgress,
    @InjectModel(Lesson)
    private readonly lessonModel: typeof Lesson,
  ) { }

  /**
   * Percent complete from LessonProgress rows for this user + course:
   * (completed count) / (total rows) × 100. If there are no rows, returns 0.
   */
  async computeLessonProgressPercent(
    userId: number,
    courseId: number,
    transaction?: Transaction,
  ): Promise<number> {
    const total = await this.lessonProgressModel.count({
      where: { userId, courseId },
      transaction,
    });
    if (total === 0) {
      return 0;
    }
    const completed = await this.lessonProgressModel.count({
      where: {
        userId,
        courseId,
        progress: LessonProgressStatus.COMPLETED,
      },
      transaction,
    });
    return (completed / total) * 100;
  }

  /**
   * Persists enroll.progress from LessonProgress and, when appropriate,
   * marks the enroll as completed (100% while still active).
   */
  async syncEnrollProgress(
    userId: number,
    courseId: number,
    transaction?: Transaction,
  ): Promise<void> {
    const enroll = await this.enrollModel.findOne({
      where: { userId, courseId },
      transaction,
    });
    if (!enroll) {
      return;
    }

    const percent = await this.computeLessonProgressPercent(
      userId,
      courseId,
      transaction,
    );

    const updates: Partial<Enroll> = { progress: percent };

    if (
      enroll.status === EnrollStatus.ACTIVE &&
      percent >= 100
    ) {
      updates.status = EnrollStatus.COMPLETED;
      updates.completedAt = enroll.completedAt ?? new Date();
    }

    await enroll.update(updates, { transaction });
  }

  async create(dto: CreateEnrollDto, userId: number | undefined): Promise<Enroll> {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }
    const course = await this.courseModel.findByPk(dto.courseId);
    if (!course) {
      throw new NotFoundException(`Course with ID ${dto.courseId} not found`);
    }

    const existing = await this.enrollModel.findOne({
      where: { userId: userId, courseId: dto.courseId },
    });
    if (existing) {
      throw new ConflictException(
        `User ${userId} is already enrolled in course ${dto.courseId}`,
      );
    }

    return this.sequelize.transaction(async (transaction) => {
      const enroll = await this.enrollModel.create(
        {
          userId: userId,
          courseId: dto.courseId,
          progress: 0,
          status: EnrollStatus.ACTIVE,
          enrolledAt: new Date(),
          completedAt: null,
        },
        { transaction },
      );

      await this.seedLessonProgressForCourse(
        userId,
        dto.courseId,
        transaction,
      );
      await this.syncEnrollProgress(userId, dto.courseId, transaction);

      const fresh = await this.enrollModel.findByPk(enroll.id, { transaction });
      if (!fresh) {
        throw new BadRequestException('Failed to load enroll after create');
      }
      return fresh;
    });
  }

  async findAll(
    query: GetEnrollsQueryDto,
    userId: number | undefined,
  ): Promise<PaginatedResponseDto<Enroll>> {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }
    const where: Record<string, unknown> = {};
    if (userId !== undefined) {
      where.userId = userId;
    }
    // if (query.courseId !== undefined) {
    //   where.courseId = query.courseId;
    // }

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const offset = (page - 1) * limit;

    const { rows, count } = await this.enrollModel.findAndCountAll({
      where,
      limit,
      offset,
      order: [['id', 'DESC']],
    });

    for (const row of rows) {
      await this.syncEnrollProgress(row.userId, row.courseId);
    }

    const refreshedRows = await this.enrollModel.findAll({
      where,
      limit,
      offset,
      order: [['id', 'DESC']],
    });

    return new PaginatedResponseDto(
      refreshedRows,
      new PaginationMetaDto(page, limit, count),
    );
  }

  async findOne(id: number): Promise<Enroll> {
    const enroll = await this.enrollModel.findByPk(id);
    if (!enroll) {
      throw new NotFoundException(`Enroll with ID ${id} not found`);
    }
    await this.syncEnrollProgress(enroll.userId, enroll.courseId);
    const reloaded = await this.enrollModel.findByPk(id);
    if (!reloaded) {
      throw new NotFoundException(`Enroll with ID ${id} not found`);
    }
    return reloaded;
  }

  async update(id: number, dto: UpdateEnrollDto): Promise<Enroll> {
    const enroll = await this.enrollModel.findByPk(id);
    if (!enroll) {
      throw new NotFoundException(`Enroll with ID ${id} not found`);
    }

    const patch: Partial<Enroll> = {};
    if (dto.status !== undefined) {
      patch.status = dto.status;
    }
    if (dto.completedAt !== undefined) {
      patch.completedAt = dto.completedAt;
    } else if (dto.status === EnrollStatus.COMPLETED) {
      patch.completedAt = enroll.completedAt ?? new Date();
    }

    await enroll.update(patch);
    await this.syncEnrollProgress(enroll.userId, enroll.courseId);

    const reloaded = await this.enrollModel.findByPk(id);
    if (!reloaded) {
      throw new NotFoundException(`Enroll with ID ${id} not found`);
    }
    return reloaded;
  }

  async remove(id: number): Promise<void> {
    const enroll = await this.enrollModel.findByPk(id);
    if (!enroll) {
      throw new NotFoundException(`Enroll with ID ${id} not found`);
    }
    await this.sequelize.transaction(async (transaction) => {
      await this.lessonProgressModel.destroy({
        where: { userId: enroll.userId, courseId: enroll.courseId },
        transaction,
      });
      await enroll.destroy({ transaction });
    });
  }

  private async seedLessonProgressForCourse(
    userId: number,
    courseId: number,
    transaction: Transaction,
  ): Promise<void> {
    const lessons = await this.lessonModel.findAll({
      where: {
        courseId,
        status: { [Op.ne]: LessonStatus.REMOVED },
      },
      transaction,
    });

    for (const lesson of lessons) {
      await this.lessonProgressModel.findOrCreate({
        where: { userId, courseId, lessonId: lesson.id },
        defaults: {
          userId,
          courseId,
          lessonId: lesson.id,
          progress: LessonProgressStatus.NOT_STARTED,
        },
        transaction,
      });
    }
  }
}
