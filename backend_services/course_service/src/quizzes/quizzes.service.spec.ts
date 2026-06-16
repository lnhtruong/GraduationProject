import { ForbiddenException } from '@nestjs/common';
import { getConnectionToken, getModelToken } from '@nestjs/sequelize';
import { Test, TestingModule } from '@nestjs/testing';

import { Quiz } from '../models/quiz.model';
import { QuizQuestion } from '../models/quiz-question.model';
import { QuizOption } from '../models/quiz-option.model';
import { Video } from '../models/video.model';
import { LessonActivity } from '../models/lesson-activity.model';
import { CourseStatus } from '../models/course.model';
import { CourseChangeRequestKind } from '../models/course-change-request.model';
import { CoursesService } from '../course/course.service';
import { QuizzesService } from './quizzes.service';

type Mock<T = any> = jest.Mock<T>;

const makeModelMock = () => ({
  findByPk: jest.fn(),
  findOne: jest.fn(),
  findAll: jest.fn(),
  create: jest.fn(),
  bulkCreate: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn(),
  restore: jest.fn(),
});

const PUBLISHED_COURSE = {
  id: 10,
  userId: 99, // owner
  status: CourseStatus.PUBLISH,
};
const DRAFT_COURSE = {
  id: 10,
  userId: 99,
  status: CourseStatus.DRAFT,
};

const OWNER = { userId: 99, role: 3 };
const STRANGER = { userId: 7, role: 3 };
const ADMIN = { userId: 1, role: 1 };

describe('QuizzesService — quiz change-request gating', () => {
  let service: QuizzesService;
  let quizModel: ReturnType<typeof makeModelMock>;
  let coursesService: {
    findCourseByLessonActivityId: Mock;
    createQuizChangeRequest: Mock;
    notifyQuizChangeDirect: Mock;
  };

  beforeEach(async () => {
    quizModel = makeModelMock();
    coursesService = {
      findCourseByLessonActivityId: jest.fn(),
      createQuizChangeRequest: jest.fn().mockResolvedValue({ id: 555 }),
      notifyQuizChangeDirect: jest.fn().mockResolvedValue(undefined),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        QuizzesService,
        { provide: getModelToken(Quiz), useValue: quizModel },
        { provide: getModelToken(QuizQuestion), useValue: makeModelMock() },
        { provide: getModelToken(QuizOption), useValue: makeModelMock() },
        { provide: getModelToken(Video), useValue: makeModelMock() },
        { provide: getModelToken(LessonActivity), useValue: makeModelMock() },
        {
          provide: getConnectionToken(),
          useValue: {
            transaction: jest.fn((cb: (t: unknown) => unknown) => cb({})),
          },
        },
        { provide: CoursesService, useValue: coursesService },
      ],
    }).compile();

    service = moduleRef.get<QuizzesService>(QuizzesService);
  });

  describe('createOneWithReview', () => {
    const payload = { lessonActivityId: 3, name: 'Q1' } as any;

    it('khóa đã publish + owner (non-admin) → tạo change request quiz.create', async () => {
      coursesService.findCourseByLessonActivityId.mockResolvedValue(
        PUBLISHED_COURSE,
      );
      const createOneSpy = jest.spyOn(service, 'createOne');

      const result = await service.createOneWithReview(payload, OWNER);

      expect(coursesService.createQuizChangeRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: CourseChangeRequestKind.QUIZ_CREATE,
          courseId: PUBLISHED_COURSE.id,
          targetId: null,
          requestedBy: OWNER.userId,
        }),
      );
      expect(createOneSpy).not.toHaveBeenCalled();
      expect(result).toEqual({ id: 555 });
    });

    it('khóa chưa publish → tạo trực tiếp + notify', async () => {
      coursesService.findCourseByLessonActivityId.mockResolvedValue(
        DRAFT_COURSE,
      );
      jest
        .spyOn(service, 'createOne')
        .mockResolvedValue({ id: 1 } as unknown as Quiz);

      const result = await service.createOneWithReview(payload, OWNER);

      expect(service.createOne).toHaveBeenCalledWith(payload);
      expect(coursesService.createQuizChangeRequest).not.toHaveBeenCalled();
      expect(coursesService.notifyQuizChangeDirect).toHaveBeenCalledWith(
        DRAFT_COURSE.id,
        CourseChangeRequestKind.QUIZ_CREATE,
        OWNER.userId,
      );
      expect(result).toEqual({ id: 1 });
    });

    it('admin → tạo trực tiếp dù khóa đã publish (không change request)', async () => {
      coursesService.findCourseByLessonActivityId.mockResolvedValue(
        PUBLISHED_COURSE,
      );
      jest
        .spyOn(service, 'createOne')
        .mockResolvedValue({ id: 2 } as unknown as Quiz);

      await service.createOneWithReview(payload, ADMIN);

      expect(coursesService.createQuizChangeRequest).not.toHaveBeenCalled();
      expect(service.createOne).toHaveBeenCalledWith(payload);
    });

    it('non-admin không phải chủ khóa → 403', async () => {
      coursesService.findCourseByLessonActivityId.mockResolvedValue(
        PUBLISHED_COURSE,
      );
      await expect(
        service.createOneWithReview(payload, STRANGER),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('updateWithReview', () => {
    // Sequelize instance expose `.get(key)` — snapshotQuiz dùng nó để chụp prevData.
    const fakeQuiz = {
      id: 42,
      lessonActivityId: 3,
      name: 'Q',
      questions: [],
      get(key: string) {
        return (this as Record<string, unknown>)[key];
      },
    };

    it('khóa đã publish + owner → change request quiz.update với targetId = quizId', async () => {
      quizModel.findByPk.mockResolvedValue(fakeQuiz);
      coursesService.findCourseByLessonActivityId.mockResolvedValue(
        PUBLISHED_COURSE,
      );
      const updateSpy = jest.spyOn(service, 'update');

      await service.updateWithReview(42, { name: 'new' } as any, OWNER);

      expect(coursesService.createQuizChangeRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: CourseChangeRequestKind.QUIZ_UPDATE,
          targetId: 42,
          courseId: PUBLISHED_COURSE.id,
        }),
      );
      expect(updateSpy).not.toHaveBeenCalled();
    });
  });

  describe('removeWithReview', () => {
    const fakeQuiz = { id: 42, lessonActivityId: 3, name: 'Q', questions: [] };

    it('khóa đã publish + owner → change request quiz.delete', async () => {
      quizModel.findByPk.mockResolvedValue(fakeQuiz);
      coursesService.findCourseByLessonActivityId.mockResolvedValue(
        PUBLISHED_COURSE,
      );
      const removeSpy = jest.spyOn(service, 'remove');

      const result = await service.removeWithReview(42, OWNER);

      expect(coursesService.createQuizChangeRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: CourseChangeRequestKind.QUIZ_DELETE,
          targetId: 42,
        }),
      );
      expect(removeSpy).not.toHaveBeenCalled();
      expect(result).toEqual({ id: 555 });
    });

    it('khóa chưa publish → xoá trực tiếp + notify, không trả change request', async () => {
      quizModel.findByPk.mockResolvedValue(fakeQuiz);
      coursesService.findCourseByLessonActivityId.mockResolvedValue(
        DRAFT_COURSE,
      );
      jest.spyOn(service, 'remove').mockResolvedValue(undefined);

      const result = await service.removeWithReview(42, OWNER);

      expect(service.remove).toHaveBeenCalledWith(42);
      expect(coursesService.createQuizChangeRequest).not.toHaveBeenCalled();
      expect(result).toBeUndefined();
    });
  });

  describe('applyApprovedQuizChange', () => {
    it('quiz.update → gọi update với targetId + payload', async () => {
      jest
        .spyOn(service, 'update')
        .mockResolvedValue({ id: 42 } as unknown as Quiz);

      await service.applyApprovedQuizChange({
        kind: CourseChangeRequestKind.QUIZ_UPDATE,
        targetId: 42,
        payload: { name: 'x' },
      } as any);

      expect(service.update).toHaveBeenCalledWith(42, { name: 'x' });
    });

    it('quiz.delete → gọi remove với targetId', async () => {
      jest.spyOn(service, 'remove').mockResolvedValue(undefined);

      await service.applyApprovedQuizChange({
        kind: CourseChangeRequestKind.QUIZ_DELETE,
        targetId: 42,
        payload: {},
      } as any);

      expect(service.remove).toHaveBeenCalledWith(42);
    });
  });
});
