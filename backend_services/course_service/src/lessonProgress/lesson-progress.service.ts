import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { EnrollsService } from 'src/enrolls/enrolls.service';
import { Course } from 'src/models/course.model';
import {
  LessonProgress,
  LessonProgressStatus,
} from 'src/models/lesson-progress.model';
import { Lesson, LessonStatus } from 'src/models/lesson.model';
import { CreateLessonProgressDto } from './dto/create-lesson-progress.dto';
import { UpdateLessonProgressDto } from './dto/update-lesson-progress.dto';
import { GetLessonProgressQueryDto } from './dto/get-lesson-progress-query.dto';
import {
  PaginationMetaDto,
  PaginatedResponseDto,
} from 'src/models/pagination.dto';

@Injectable()
export class LessonProgressService {
  constructor(
    @InjectModel(LessonProgress)
    private readonly lessonProgressModel: typeof LessonProgress,
    @InjectModel(Course)
    private readonly courseModel: typeof Course,
    @InjectModel(Lesson)
    private readonly lessonModel: typeof Lesson,
    private readonly enrollsService: EnrollsService,
  ) {}

  async create(
    dto: CreateLessonProgressDto,
    userId: number | undefined,
  ): Promise<LessonProgress> {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }
    await this.assertCourseExists(dto.courseId);
    await this.assertLessonBelongsToCourse(dto.lessonId, dto.courseId);

    const duplicate = await this.lessonProgressModel.findOne({
      where: {
        userId: userId,
        courseId: dto.courseId,
        lessonId: dto.lessonId,
      },
    });

    if (duplicate) {
      let didUpdate = false;
      if (dto.progress !== undefined && dto.progress !== duplicate.progress) {
        await duplicate.update({ progress: dto.progress });
        didUpdate = true;
      }

      if (didUpdate && dto.progress === LessonProgressStatus.COMPLETED) {
        // If we just marked lesson complete, sync enroll progress for course.
        await this.enrollsService.syncEnrollProgress(userId, dto.courseId);
      }

      return duplicate;
    }

    const row = await this.lessonProgressModel.create({
      userId: userId,
      courseId: dto.courseId,
      lessonId: dto.lessonId,
      progress: dto.progress ?? LessonProgressStatus.NOT_STARTED,
    });

    // New row created — sync enroll progress for safety (e.g., if started/completed).
    await this.enrollsService.syncEnrollProgress(userId, dto.courseId);
    return row;
  }

  async findAll(
    query: GetLessonProgressQueryDto,
    userId: number | undefined,
  ): Promise<PaginatedResponseDto<LessonProgress>> {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }
    const where: Record<string, unknown> = {};
    if (userId !== undefined) {
      where.userId = userId;
    }
    if (query.courseId !== undefined) {
      where.courseId = query.courseId;
    }
    // if (query.lessonId !== undefined) {
    //   where.lessonId = query.lessonId;
    // }

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const offset = (page - 1) * limit;

    const { rows, count } = await this.lessonProgressModel.findAndCountAll({
      where,
      limit,
      offset,
      order: [
        ['courseId', 'ASC'],
        ['lessonId', 'ASC'],
        ['id', 'ASC'],
      ],
    });

    return new PaginatedResponseDto(
      rows,
      new PaginationMetaDto(page, limit, count),
    );
  }

  async findOne(id: number): Promise<LessonProgress> {
    const row = await this.lessonProgressModel.findByPk(id);
    if (!row) {
      throw new NotFoundException(`Lesson progress with ID ${id} not found`);
    }
    return row;
  }

  async update(
    id: number,
    dto: UpdateLessonProgressDto,
    userId: number | undefined,
  ): Promise<LessonProgress> {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    const row = await this.findOne(id);
    if (row.userId !== userId) {
      throw new ForbiddenException('Lesson progress does not belong to user');
    }

    await row.update(dto);
    if (dto.progress === LessonProgressStatus.COMPLETED) {
      await this.enrollsService.syncEnrollProgress(row.userId, row.courseId);
    }
    return this.findOne(id);
  }

  async heartbeat(
    id: number,
    position: number,
    userId: number | undefined,
  ): Promise<{ ok: true; position: number; lastWatchedAt: Date }> {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    const lastWatchedAt = new Date();

    // Single atomic UPDATE scoped to (id, userId) so concurrent heartbeats
    // can't interleave a stale read with a fresher write.
    const [affected] = await this.lessonProgressModel.update(
      {
        lastVideoPositionMs: position,
        lastWatchedAt,
        progress: LessonProgressStatus.IN_PROGRESS,
      },
      {
        where: {
          id,
          userId,
          progress: { [Op.ne]: LessonProgressStatus.COMPLETED },
        },
      },
    );

    if (affected === 0) {
      // Distinguish missing row vs. ownership/state mismatch.
      const row = await this.lessonProgressModel.findByPk(id);
      if (!row) {
        throw new NotFoundException(`Lesson progress with ID ${id} not found`);
      }
      if (row.userId !== userId) {
        throw new ForbiddenException('Lesson progress does not belong to user');
      }
      // Already completed — return its persisted position without bumping it.
      return {
        ok: true,
        position: row.lastVideoPositionMs,
        lastWatchedAt: row.lastWatchedAt ?? new Date(0),
      };
    }

    return { ok: true, position, lastWatchedAt };
  }

  async continueWatching(
    userId: number | undefined,
    limit = 10,
  ): Promise<{
    items: Array<{
      progressId: number;
      course: Course | null;
      lesson: Lesson | null;
      lastVideoPositionMs: number;
      lastWatchedAt: Date | null;
      percentage: number;
    }>;
  }> {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    const parsedLimit = Number(limit);
    if (!Number.isInteger(parsedLimit)) {
      throw new BadRequestException('limit must be an integer');
    }
    const cappedLimit = Math.min(Math.max(parsedLimit, 1), 10);

    const rows = await this.lessonProgressModel.findAll({
      where: {
        userId,
        progress: { [Op.ne]: LessonProgressStatus.COMPLETED },
        lastWatchedAt: { [Op.ne]: null },
      },
      include: [
        { model: Course, required: false },
        { model: Lesson, required: false },
      ],
      order: [['lastWatchedAt', 'DESC']],
      limit: cappedLimit,
    });

    // Compute completion percentage per course, once per distinct courseId.
    const percentByCourse = new Map<number, number>();
    for (const row of rows) {
      if (percentByCourse.has(row.courseId)) continue;
      percentByCourse.set(
        row.courseId,
        await this.enrollsService.computeLessonProgressPercent(
          userId,
          row.courseId,
        ),
      );
    }

    return {
      items: rows.map((row) => ({
        progressId: row.id,
        course: row.course ?? null,
        lesson: row.lesson ?? null,
        lastVideoPositionMs: row.lastVideoPositionMs,
        lastWatchedAt: row.lastWatchedAt,
        percentage: percentByCourse.get(row.courseId) ?? 0,
      })),
    };
  }

  async remove(id: number): Promise<void> {
    const row = await this.lessonProgressModel.findByPk(id);
    if (!row) {
      throw new NotFoundException(`Lesson progress with ID ${id} not found`);
    }
    const { userId, courseId } = row;
    await this.enrollsService.syncEnrollProgress(userId, courseId);
    await row.destroy();
  }

  private async assertCourseExists(courseId: number): Promise<void> {
    const course = await this.courseModel.findByPk(courseId);
    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }
  }

  private async assertLessonBelongsToCourse(
    lessonId: number,
    courseId: number,
  ): Promise<void> {
    const lesson = await this.lessonModel.findByPk(lessonId);
    if (!lesson || lesson.status === LessonStatus.REMOVED) {
      throw new NotFoundException(`Lesson with ID ${lessonId} not found`);
    }
    if (lesson.courseId !== courseId) {
      throw new BadRequestException(
        `Lesson ${lessonId} does not belong to course ${courseId}`,
      );
    }
  }
}
