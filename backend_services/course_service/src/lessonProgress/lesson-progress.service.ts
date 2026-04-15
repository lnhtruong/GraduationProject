import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { EnrollsService } from 'src/enrolls/enrolls.service';
import { Course } from 'src/models/course.model';
import { LessonProgress, LessonProgressStatus } from 'src/models/lesson-progress.model';
import { Lesson, LessonStatus } from 'src/models/lesson.model';
import { CreateLessonProgressDto } from './dto/create-lesson-progress.dto';
import { UpdateLessonProgressDto } from './dto/update-lesson-progress.dto';
import { GetLessonProgressQueryDto } from './dto/get-lesson-progress-query.dto';
import { PaginationMetaDto, PaginatedResponseDto } from 'src/models/pagination.dto';

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
  ) { }

  async create(dto: CreateLessonProgressDto, userId: number | undefined): Promise<LessonProgress> {
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
      throw new ConflictException(
        'Lesson progress already exists for this user, course, and lesson',
      );
    }

    const row = await this.lessonProgressModel.create({
      userId: userId,
      courseId: dto.courseId,
      lessonId: dto.lessonId,
      progress: dto.progress ?? LessonProgressStatus.NOT_STARTED,
    });

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
  ): Promise<LessonProgress> {
    const row = await this.findOne(id);
    await row.update(dto);
    await this.enrollsService.syncEnrollProgress(row.userId, row.courseId);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const row = await this.lessonProgressModel.findByPk(id);
    if (!row) {
      throw new NotFoundException(`Lesson progress with ID ${id} not found`);
    }
    const { userId, courseId } = row;
    await row.destroy();
    await this.enrollsService.syncEnrollProgress(userId, courseId);
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
