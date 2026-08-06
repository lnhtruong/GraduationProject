import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { getModelToken } from '@nestjs/sequelize';
import { Test, TestingModule } from '@nestjs/testing';
import { Course, CourseStatus } from '../models/course.model';
import { Lesson, LessonStatus } from '../models/lesson.model';
import { Report, ReportCategory, ReportStatus, ReportTargetType } from '../models/report.model';
import { User } from '../users/user.model';
import { MascotImage } from '../models/images.model';
import { AuditLogsService } from '../audit_logs/audit-logs.service';
import { ReportsService } from './reports.service';

type Mock<T = any> = jest.Mock<T>;

interface ModelMock {
  findByPk: Mock;
  findOne: Mock;
  findAndCountAll: Mock;
  findAll: Mock;
  count: Mock;
  create: Mock;
  destroy: Mock;
}

const makeModelMock = (): ModelMock => ({
  findByPk: jest.fn(),
  findOne: jest.fn(),
  findAndCountAll: jest.fn(),
  findAll: jest.fn(),
  count: jest.fn(),
  create: jest.fn(),
  destroy: jest.fn(),
});

const fakeRow = (data: Record<string, any>) => ({
  ...data,
  get: ({ plain }: { plain: boolean } = { plain: true }) =>
    plain ? data : data,
  update: jest.fn(async function (this: any, patch: Record<string, any>) {
    Object.assign(this, patch);
    return this;
  }),
});

describe('ReportsService', () => {
  let service: ReportsService;
  let reportModel: ModelMock;
  let courseModel: ModelMock;
  let lessonModel: ModelMock;
  let userModel: ModelMock;
  let mascotImageModel: ModelMock;

  beforeEach(async () => {
    reportModel = makeModelMock();
    courseModel = makeModelMock();
    lessonModel = makeModelMock();
    userModel = makeModelMock();
    mascotImageModel = makeModelMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: getModelToken(Report), useValue: reportModel },
        { provide: getModelToken(Course), useValue: courseModel },
        { provide: getModelToken(Lesson), useValue: lessonModel },
        { provide: getModelToken(User), useValue: userModel },
        { provide: getModelToken(MascotImage), useValue: mascotImageModel },
        { provide: AuditLogsService, useValue: { log: jest.fn() } },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
  });

  // -------- create --------
  describe('create', () => {
    const reporterId = 10;

    it('tạo report course thành công', async () => {
      courseModel.findByPk.mockResolvedValueOnce(
        fakeRow({ id: 5, userId: 99, status: CourseStatus.PUBLISH }),
      );
      reportModel.findOne.mockResolvedValueOnce(null);
      reportModel.create.mockResolvedValueOnce(
        fakeRow({ id: 1, status: ReportStatus.PENDING }),
      );

      const r = await service.create(reporterId, {
        targetType: ReportTargetType.COURSE,
        targetId: 5,
        reportCategory: ReportCategory.SPAM,
        reason: 'spam content',
      });

      expect(r).toBeDefined();
      expect(reportModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          targetType: ReportTargetType.COURSE,
          targetId: 5,
          reportCategory: ReportCategory.SPAM,
          reporterId,
          status: ReportStatus.PENDING,
        }),
      );
    });

    it('404 khi course không tồn tại', async () => {
      courseModel.findByPk.mockResolvedValueOnce(null);
      await expect(
        service.create(reporterId, {
          targetType: ReportTargetType.COURSE,
          targetId: 999,
          reason: 'xxxx',
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('409 khi course đã banned', async () => {
      courseModel.findByPk.mockResolvedValueOnce(
        fakeRow({ id: 5, userId: 99, status: CourseStatus.BANNED }),
      );
      await expect(
        service.create(reporterId, {
          targetType: ReportTargetType.COURSE,
          targetId: 5,
          reason: 'xxxx',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('403 khi report khoá của chính mình', async () => {
      courseModel.findByPk.mockResolvedValueOnce(
        fakeRow({ id: 5, userId: reporterId, status: CourseStatus.PUBLISH }),
      );
      await expect(
        service.create(reporterId, {
          targetType: ReportTargetType.COURSE,
          targetId: 5,
          reason: 'xxxx',
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('403 khi report bài học thuộc khoá của mình', async () => {
      lessonModel.findByPk.mockResolvedValueOnce(
        fakeRow({ id: 7, courseId: 5, status: LessonStatus.ACTIVE }),
      );
      courseModel.findByPk.mockResolvedValueOnce(
        fakeRow({ id: 5, userId: reporterId }),
      );
      await expect(
        service.create(reporterId, {
          targetType: ReportTargetType.LESSON,
          targetId: 7,
          reason: 'xxxx',
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('409 khi lesson đã bị block', async () => {
      lessonModel.findByPk.mockResolvedValueOnce(
        fakeRow({ id: 7, courseId: 5, status: LessonStatus.BLOCKED }),
      );
      await expect(
        service.create(reporterId, {
          targetType: ReportTargetType.LESSON,
          targetId: 7,
          reason: 'xxxx',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('403 khi tự report bản thân (teacher)', async () => {
      await expect(
        service.create(reporterId, {
          targetType: ReportTargetType.TEACHER,
          targetId: reporterId,
          reason: 'xxxx',
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('409 khi teacher đã bị ban', async () => {
      userModel.findByPk.mockResolvedValueOnce(
        fakeRow({ id: 50, role: 3, isBanned: true }),
      );
      await expect(
        service.create(reporterId, {
          targetType: ReportTargetType.TEACHER,
          targetId: 50,
          reason: 'xxxx',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('409 khi đã có report PENDING cho cùng target', async () => {
      courseModel.findByPk.mockResolvedValueOnce(
        fakeRow({ id: 5, userId: 99, status: CourseStatus.PUBLISH }),
      );
      reportModel.findOne.mockResolvedValueOnce(fakeRow({ id: 1 }));
      await expect(
        service.create(reporterId, {
          targetType: ReportTargetType.COURSE,
          targetId: 5,
          reason: 'xxxx',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  // -------- listAll --------
  describe('listAll', () => {
    it('trả về paginated kèm target snapshot', async () => {
      const row = fakeRow({
        id: 1,
        targetType: ReportTargetType.COURSE,
        targetId: 5,
        status: ReportStatus.PENDING,
        reporterId: 10,
      });
      reportModel.findAndCountAll.mockResolvedValueOnce({
        rows: [row],
        count: 1,
      });
      courseModel.findByPk.mockResolvedValueOnce(
        fakeRow({ id: 5, name: 'C', status: CourseStatus.PUBLISH, userId: 99 }),
      );

      const res = await service.listAll({
        page: 1,
        limit: 10,
        status: ReportStatus.PENDING,
      });

      expect(res.pagination).toEqual({
        page: 1,
        limit: 10,
        totalItems: 1,
        totalPages: 1,
      });
      expect(res.items).toHaveLength(1);
      expect(res.items[0].target).toEqual(
        expect.objectContaining({ id: 5, name: 'C' }),
      );
      expect(reportModel.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: ReportStatus.PENDING },
          limit: 10,
          offset: 0,
        }),
      );
    });

    it('clamp limit > 100 về 100', async () => {
      reportModel.findAndCountAll.mockResolvedValueOnce({ rows: [], count: 0 });
      await service.listAll({ page: 1, limit: 9999 });
      expect(reportModel.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 100 }),
      );
    });
  });

  // -------- getById --------
  describe('getById', () => {
    it('404 khi không tồn tại', async () => {
      reportModel.findByPk.mockResolvedValueOnce(null);
      await expect(service.getById(99)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('trả về detail kèm target', async () => {
      reportModel.findByPk.mockResolvedValueOnce(
        fakeRow({
          id: 1,
          targetType: ReportTargetType.LESSON,
          targetId: 7,
        }),
      );
      lessonModel.findByPk.mockResolvedValueOnce(
        fakeRow({
          id: 7,
          title: 'L',
          status: LessonStatus.ACTIVE,
          courseId: 5,
        }),
      );
      const res = await service.getById(1);
      expect(res.target).toEqual(
        expect.objectContaining({ id: 7, title: 'L' }),
      );
    });
  });

  // -------- review --------
  describe('review', () => {
    const approverId = 1;

    it('400 nếu decision không hợp lệ', async () => {
      await expect(
        service.review(1, approverId, { decision: 'pending' as any }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('404 nếu report không tồn tại', async () => {
      reportModel.findByPk.mockResolvedValueOnce(null);
      await expect(
        service.review(99, approverId, { decision: ReportStatus.APPROVED }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('409 nếu report đã được duyệt', async () => {
      reportModel.findByPk.mockResolvedValueOnce(
        fakeRow({ id: 1, status: ReportStatus.APPROVED }),
      );
      await expect(
        service.review(1, approverId, { decision: ReportStatus.REJECTED }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('approve + banTarget=true ban course', async () => {
      const reportRow = fakeRow({
        id: 1,
        status: ReportStatus.PENDING,
        targetType: ReportTargetType.COURSE,
        targetId: 5,
      });
      const courseRow = fakeRow({ id: 5, status: CourseStatus.PUBLISH });
      reportModel.findByPk.mockResolvedValueOnce(reportRow);
      courseModel.findByPk.mockResolvedValueOnce(courseRow);

      await service.review(1, approverId, {
        decision: ReportStatus.APPROVED,
        banTarget: true,
        reviewNote: 'vp',
      });

      expect(courseRow.update).toHaveBeenCalledWith({
        status: CourseStatus.BANNED,
      });
      expect(reportRow.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: ReportStatus.APPROVED,
          approverId,
          reviewNote: 'vp',
        }),
      );
    });

    it('approve + banTarget=true ban lesson', async () => {
      const reportRow = fakeRow({
        id: 1,
        status: ReportStatus.PENDING,
        targetType: ReportTargetType.LESSON,
        targetId: 7,
      });
      const lessonRow = fakeRow({ id: 7, status: LessonStatus.ACTIVE });
      reportModel.findByPk.mockResolvedValueOnce(reportRow);
      lessonModel.findByPk.mockResolvedValueOnce(lessonRow);

      await service.review(1, approverId, {
        decision: ReportStatus.APPROVED,
        banTarget: true,
      });

      expect(lessonRow.update).toHaveBeenCalledWith({
        status: LessonStatus.BLOCKED,
      });
    });

    it('approve + banTarget=true ban teacher', async () => {
      const reportRow = fakeRow({
        id: 1,
        status: ReportStatus.PENDING,
        targetType: ReportTargetType.TEACHER,
        targetId: 50,
      });
      const userRow = fakeRow({ id: 50, isBanned: false });
      reportModel.findByPk.mockResolvedValueOnce(reportRow);
      userModel.findByPk.mockResolvedValueOnce(userRow);

      await service.review(1, approverId, {
        decision: ReportStatus.APPROVED,
        banTarget: true,
      });

      expect(userRow.update).toHaveBeenCalledWith({ isBanned: true });
    });

    it('reject không gọi banTarget', async () => {
      const reportRow = fakeRow({
        id: 1,
        status: ReportStatus.PENDING,
        targetType: ReportTargetType.COURSE,
        targetId: 5,
      });
      reportModel.findByPk.mockResolvedValueOnce(reportRow);

      await service.review(1, approverId, {
        decision: ReportStatus.REJECTED,
        banTarget: true,
        reviewNote: 'no proof',
      });

      expect(courseModel.findByPk).not.toHaveBeenCalled();
      expect(reportRow.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: ReportStatus.REJECTED }),
      );
    });
  });

  // -------- listByReporter --------
  describe('listByReporter', () => {
    it('chỉ filter theo reporterId', async () => {
      reportModel.findAndCountAll.mockResolvedValueOnce({ rows: [], count: 0 });
      await service.listByReporter(10, { page: 1, limit: 5 });
      expect(reportModel.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { reporterId: 10 },
          limit: 5,
          offset: 0,
        }),
      );
    });
  });
});
