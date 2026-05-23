import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Course, CourseStatus } from 'src/models/course.model';
import { Lesson, LessonStatus } from 'src/models/lesson.model';
import {
  Report,
  ReportStatus,
  ReportTargetType,
} from 'src/models/report.model';
import { User } from 'src/users/user.model';
import { CreateReportDto } from './dto/create-report.dto';
import { ReviewReportDto } from './dto/review-report.dto';

const LECTURER_ROLE = 3;

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Report) private readonly reportModel: typeof Report,
    @InjectModel(Course) private readonly courseModel: typeof Course,
    @InjectModel(Lesson) private readonly lessonModel: typeof Lesson,
    @InjectModel(User) private readonly userModel: typeof User,
  ) {}

  async create(reporterId: number, payload: CreateReportDto): Promise<Report> {
    await this.validateReportTarget(reporterId, payload.targetType, payload.targetId);

    const existed = await this.reportModel.findOne({
      where: {
        reporterId,
        targetType: payload.targetType,
        targetId: payload.targetId,
        status: ReportStatus.PENDING,
      },
    });
    if (existed) {
      throw new ConflictException('Bạn đã có 1 report đang chờ duyệt cho đối tượng này');
    }

    return await this.reportModel.create({
      targetType: payload.targetType,
      targetId: payload.targetId,
      reason: payload.reason,
      reporterId,
      status: ReportStatus.PENDING,
    });
  }

  async listAll(params: {
    page?: number;
    limit?: number;
    status?: ReportStatus;
    targetType?: ReportTargetType;
  }) {
    const safePage =
      Number.isInteger(params.page) && (params.page as number) > 0
        ? (params.page as number)
        : 1;
    const safeLimit =
      Number.isInteger(params.limit) && (params.limit as number) > 0
        ? Math.min(params.limit as number, 100)
        : 20;
    const offset = (safePage - 1) * safeLimit;

    const where: Record<string, unknown> = {};
    if (params.status) where.status = params.status;
    if (params.targetType) where.targetType = params.targetType;

    const { rows, count } = await this.reportModel.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'reporter',
          attributes: ['id', 'firstName', 'lastName', 'email'],
          required: false,
        },
        {
          model: User,
          as: 'approver',
          attributes: ['id', 'firstName', 'lastName', 'email'],
          required: false,
        },
      ],
      order: [['id', 'DESC']],
      offset,
      limit: safeLimit,
    });

    const items = await Promise.all(
      rows.map(async (r) => ({
        ...r.get({ plain: true }),
        target: await this.getTargetSnapshot(r.targetType, r.targetId),
      })),
    );

    return {
      items,
      pagination: {
        page: safePage,
        limit: safeLimit,
        totalItems: count,
        totalPages: Math.ceil(count / safeLimit),
      },
    };
  }

  async getById(id: number): Promise<Record<string, unknown>> {
    const report = await this.reportModel.findByPk(id, {
      include: [
        { model: User, as: 'reporter', attributes: ['id', 'firstName', 'lastName', 'email'], required: false },
        { model: User, as: 'approver', attributes: ['id', 'firstName', 'lastName', 'email'], required: false },
      ],
    });
    if (!report) {
      throw new NotFoundException(`Không tìm thấy report ${id}`);
    }

    const reportCount = await this.reportModel.count({
      where: {
        targetType: report.targetType,
        targetId: report.targetId,
        status: ReportStatus.PENDING,
      },
    });

    return {
      ...report.get({ plain: true }),
      target: await this.getTargetSnapshot(report.targetType, report.targetId),
      reportCount,
    };
  }

  async listByReporter(reporterId: number, params: { page?: number; limit?: number }) {
    const safePage =
      Number.isInteger(params.page) && (params.page as number) > 0 ? (params.page as number) : 1;
    const safeLimit =
      Number.isInteger(params.limit) && (params.limit as number) > 0
        ? Math.min(params.limit as number, 100)
        : 20;
    const offset = (safePage - 1) * safeLimit;

    const { rows, count } = await this.reportModel.findAndCountAll({
      where: { reporterId },
      order: [['id', 'DESC']],
      offset,
      limit: safeLimit,
    });

    const items = await Promise.all(
      rows.map(async (r) => ({
        ...r.get({ plain: true }),
        target: await this.getTargetSnapshot(r.targetType, r.targetId),
      })),
    );

    return {
      items,
      pagination: {
        page: safePage,
        limit: safeLimit,
        totalItems: count,
        totalPages: Math.ceil(count / safeLimit),
      },
    };
  }

  async review(
    id: number,
    approverId: number,
    payload: ReviewReportDto,
  ): Promise<Report> {
    if (
      payload.decision !== ReportStatus.APPROVED &&
      payload.decision !== ReportStatus.REJECTED
    ) {
      throw new BadRequestException('decision phải là approved hoặc rejected');
    }

    const report = await this.reportModel.findByPk(id);
    if (!report) {
      throw new NotFoundException(`Không tìm thấy report ${id}`);
    }
    if (report.status !== ReportStatus.PENDING) {
      throw new ConflictException('Report đã được duyệt trước đó');
    }

    await report.update({
      status: payload.decision,
      approverId,
      reviewNote: payload.reviewNote ?? null,
      reviewedAt: new Date(),
    });

    if (payload.decision === ReportStatus.APPROVED && payload.banTarget) {
      await this.banTarget(report.targetType, report.targetId);
      await this.reportModel.destroy({
        where: {
          targetType: report.targetType,
          targetId: report.targetId,
          status: ReportStatus.PENDING,
          id: { [Op.ne]: report.id },
        },
      });
    }

    return report;
  }

  private async validateReportTarget(
    reporterId: number,
    targetType: ReportTargetType,
    targetId: number,
  ): Promise<void> {
    if (targetType === ReportTargetType.COURSE) {
      const course = await this.courseModel.findByPk(targetId, {
        attributes: ['id', 'userId', 'status'],
      });
      if (!course) throw new NotFoundException(`Không tìm thấy khoá học ${targetId}`);
      if (course.status === CourseStatus.BANNED) {
        throw new ConflictException('Khoá học đã bị ban, không cần report nữa');
      }
      if (course.userId === reporterId) {
        throw new ForbiddenException('Không thể report khoá học của chính bạn');
      }
      return;
    }

    if (targetType === ReportTargetType.LESSON) {
      const lesson = await this.lessonModel.findByPk(targetId, {
        attributes: ['id', 'courseId', 'status'],
      });
      if (!lesson) throw new NotFoundException(`Không tìm thấy bài học ${targetId}`);
      if (lesson.status === LessonStatus.BLOCKED) {
        throw new ConflictException('Bài học đã bị block, không cần report nữa');
      }
      const owningCourse = await this.courseModel.findByPk(lesson.courseId, {
        attributes: ['id', 'userId'],
      });
      if (owningCourse && owningCourse.userId === reporterId) {
        throw new ForbiddenException('Không thể report bài học thuộc khoá của bạn');
      }
      return;
    }

    if (targetType === ReportTargetType.TEACHER) {
      if (targetId === reporterId) {
        throw new ForbiddenException('Không thể tự report chính mình');
      }
      const user = await this.userModel.findByPk(targetId, {
        attributes: ['id', 'role', 'isBanned'],
      });
      if (!user) throw new NotFoundException(`Không tìm thấy user ${targetId}`);
      if (user.role !== LECTURER_ROLE) {
        throw new BadRequestException('User này không phải giảng viên');
      }
      if (user.isBanned) {
        throw new ConflictException('Giảng viên đã bị ban, không cần report nữa');
      }
      return;
    }

    throw new BadRequestException('targetType không hợp lệ');
  }

  private async banTarget(
    targetType: ReportTargetType,
    targetId: number,
  ): Promise<void> {
    if (targetType === ReportTargetType.COURSE) {
      const course = await this.courseModel.findByPk(targetId);
      if (course) await course.update({ status: CourseStatus.BANNED });
    } else if (targetType === ReportTargetType.LESSON) {
      const lesson = await this.lessonModel.findByPk(targetId);
      if (lesson) await lesson.update({ status: LessonStatus.BLOCKED });
    } else if (targetType === ReportTargetType.TEACHER) {
      const user = await this.userModel.findByPk(targetId);
      if (user) await user.update({ isBanned: true });
    }
  }

  private async getTargetSnapshot(
    targetType: ReportTargetType,
    targetId: number,
  ): Promise<Record<string, unknown> | null> {
    if (targetType === ReportTargetType.COURSE) {
      const course = await this.courseModel.findByPk(targetId, {
        attributes: ['id', 'name', 'status', 'userId'],
      });
      return course ? course.get({ plain: true }) : null;
    }
    if (targetType === ReportTargetType.LESSON) {
      const lesson = await this.lessonModel.findByPk(targetId, {
        attributes: ['id', 'title', 'status', 'courseId'],
      });
      return lesson ? lesson.get({ plain: true }) : null;
    }
    if (targetType === ReportTargetType.TEACHER) {
      const user = await this.userModel.findByPk(targetId, {
        attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'isBanned'],
      });
      return user ? user.get({ plain: true }) : null;
    }
    return null;
  }
}
