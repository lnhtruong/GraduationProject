import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { Op, Transaction } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Course, CourseStatus } from 'src/models/course.model';
import { Enroll, EnrollStatus } from 'src/models/enroll.model';
import {
  LessonProgress,
  LessonProgressStatus,
} from 'src/models/lesson-progress.model';
import { Lesson, LessonStatus } from 'src/models/lesson.model';
import { CreateEnrollDto } from './dto/create-enroll.dto';
import { UpdateEnrollDto } from './dto/update-enroll.dto';
import { GetEnrollsQueryDto } from './dto/get-enrolls-query.dto';
import {
  PaginationMetaDto,
  PaginatedResponseDto,
} from 'src/models/pagination.dto';
import { CheckEnrollExistsDto } from './dto/check-enroll-exists.dto';

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
  ) {}

  /**
   * Percent complete for this user + course.
   *
   * Mẫu số = số lesson HIỆN TẠI (chưa bị xoá mềm) của course — KHÔNG dựa vào
   * số LessonProgress row đã seed. Nhờ vậy progress luôn đúng kể cả khi lesson
   * set thay đổi: lesson mới thêm vào (chưa có progress row) tự động kéo % xuống,
   * lesson đã xoá mềm không còn được tính vào tử/mẫu số. Trả 0 nếu course chưa
   * có lesson nào.
   */
  async computeLessonProgressPercent(
    userId: number,
    courseId: number,
    transaction?: Transaction,
  ): Promise<number> {
    const activeLessons = await this.lessonModel.findAll({
      where: { courseId, status: { [Op.ne]: LessonStatus.REMOVED } },
      attributes: ['id'],
      transaction,
    });
    const total = activeLessons.length;
    if (total === 0) {
      return 0;
    }

    const activeLessonIds = activeLessons.map((lesson) => lesson.id);
    const completed = await this.lessonProgressModel.count({
      where: {
        userId,
        courseId,
        lessonId: { [Op.in]: activeLessonIds },
        progress: LessonProgressStatus.COMPLETED,
      },
      transaction,
    });
    return (completed / total) * 100;
  }

  /**
   * Đồng bộ lại progress của TẤT CẢ enroll trong một course sau khi lesson set
   * thay đổi (thêm/xoá lesson): seed các LessonProgress còn thiếu cho lesson mới
   * rồi tính lại enroll.progress. No-op nếu course chưa có ai enroll, nên gọi an
   * toàn từ luồng sửa lesson (kể cả course chưa publish).
   */
  async reconcileCourseEnrollProgress(courseId: number): Promise<void> {
    const enrolls = await this.enrollModel.findAll({ where: { courseId } });
    if (enrolls.length === 0) {
      return;
    }

    for (const enroll of enrolls) {
      await this.sequelize.transaction(async (transaction) => {
        await this.seedLessonProgressForCourse(
          enroll.userId,
          courseId,
          transaction,
        );
        await this.syncEnrollProgress(enroll.userId, courseId, transaction);
      });
    }
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

    // Luôn cập nhật progress value. Nhưng KHÔNG hạ status: user đã COMPLETED thì
    // giữ nguyên status/completedAt kể cả khi % tụt xuống dưới 100 (thêm lesson
    // mới sau khi approve change request) — chỉ progress phản ánh tập lesson mới.
    const updates: Partial<Enroll> = { progress: percent };

    if (percent >= 100 && enroll.status === EnrollStatus.ACTIVE) {
      updates.status = EnrollStatus.COMPLETED;
      updates.completedAt = enroll.completedAt ?? new Date();
    }

    await enroll.update(updates, { transaction });
  }

  async create(
    dto: CreateEnrollDto,
    userId: number | undefined,
  ): Promise<Enroll> {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }
    const course = await this.courseModel.findByPk(dto.courseId);
    if (!course) {
      throw new NotFoundException(`Course with ID ${dto.courseId} not found`);
    }

    const status = course.status as CourseStatus;
    if (status !== CourseStatus.PUBLISH) {
      throw new ConflictException(`User only enroll published course!`);
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

      await this.seedLessonProgressForCourse(userId, dto.courseId, transaction);
      // await this.syncEnrollProgress(userId, dto.courseId, transaction);

      // const fresh = await this.enrollModel.findByPk(enroll.id, { transaction });
      // if (!fresh) {
      //   throw new BadRequestException('Failed to load enroll after create');
      // }
      return enroll;
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
      include: [{ model: Course }],
      limit,
      offset,
      order: [['id', 'DESC']],
    });

    // for (const row of rows) {
    //   await this.syncEnrollProgress(row.userId, row.courseId);
    // }

    // const refreshedRows = await this.enrollModel.findAll({
    //   where,
    //   limit,
    //   offset,
    //   order: [['id', 'DESC']],
    // });

    return new PaginatedResponseDto(
      // refreshedRows,
      rows,
      new PaginationMetaDto(page, limit, count),
    );
  }

  async findOne(id: number): Promise<Enroll> {
    const enroll = await this.enrollModel.findByPk(id);
    if (!enroll) {
      throw new NotFoundException(`Enroll with ID ${id} not found`);
    }
    // await this.syncEnrollProgress(enroll.userId, enroll.courseId);
    // const reloaded = await this.enrollModel.findByPk(id);
    // if (!reloaded) {
    //   throw new NotFoundException(`Enroll with ID ${id} not found`);
    // }
    return enroll;
  }

  async checkEnrollExists(dto: CheckEnrollExistsDto): Promise<{
    check: boolean;
    data: Enroll | null;
  }> {
    const enroll = await this.enrollModel.findOne({
      where: {
        userId: dto.userId,
        courseId: dto.courseId,
      },
      include: [{ model: Course }],
    });

    return {
      check: !!enroll,
      data: enroll,
    };
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
