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

describe('QuizzesService - direct quiz write review guards', () => {
  let service: QuizzesService;
  let quizModel: ReturnType<typeof makeModelMock>;
  let lessonActivityModel: ReturnType<typeof makeModelMock>;
  let coursesService: {
    findCourseByLessonActivityId: Mock;
    createQuizChangeRequest: Mock;
    notifyQuizChangeDirect: Mock;
  };

  beforeEach(async () => {
    quizModel = makeModelMock();
    lessonActivityModel = makeModelMock();
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
        { provide: getModelToken(LessonActivity), useValue: lessonActivityModel },
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

    it('published course + owner (non-admin) -> create directly and notify', async () => {
      coursesService.findCourseByLessonActivityId.mockResolvedValue(
        PUBLISHED_COURSE,
      );
      jest
        .spyOn(service, 'createOne')
        .mockResolvedValue({ id: 1 } as unknown as Quiz);

      const result = await service.createOneWithReview(payload, OWNER);

      expect(service.createOne).toHaveBeenCalledWith(payload);
      expect(coursesService.createQuizChangeRequest).not.toHaveBeenCalled();
      expect(coursesService.notifyQuizChangeDirect).toHaveBeenCalledWith(
        PUBLISHED_COURSE.id,
        CourseChangeRequestKind.QUIZ_CREATE,
        OWNER.userId,
      );
      expect(result).toEqual({ id: 1 });
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

    it('published course + owner -> update directly and notify', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(fakeQuiz as unknown as Quiz);
      coursesService.findCourseByLessonActivityId.mockResolvedValue(
        PUBLISHED_COURSE,
      );
      jest
        .spyOn(service, 'update')
        .mockResolvedValue({ ...fakeQuiz, name: 'new' } as unknown as Quiz);

      const result = await service.updateWithReview(42, { name: 'new' } as any, OWNER);

      expect(service.update).toHaveBeenCalledWith(42, { name: 'new' });
      expect(coursesService.createQuizChangeRequest).not.toHaveBeenCalled();
      expect(coursesService.notifyQuizChangeDirect).toHaveBeenCalledWith(
        PUBLISHED_COURSE.id,
        CourseChangeRequestKind.QUIZ_UPDATE,
        OWNER.userId,
      );
      expect(result).toEqual({ ...fakeQuiz, name: 'new' });
    });
  });

  describe('removeWithReview', () => {
    const fakeQuiz = { id: 42, lessonActivityId: 3, name: 'Q', questions: [] };

    it('published course + owner -> remove directly and notify', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(fakeQuiz as unknown as Quiz);
      coursesService.findCourseByLessonActivityId.mockResolvedValue(
        PUBLISHED_COURSE,
      );
      jest.spyOn(service, 'remove').mockResolvedValue(undefined);

      const result = await service.removeWithReview(42, OWNER);

      expect(service.remove).toHaveBeenCalledWith(42);
      expect(coursesService.createQuizChangeRequest).not.toHaveBeenCalled();
      expect(coursesService.notifyQuizChangeDirect).toHaveBeenCalledWith(
        PUBLISHED_COURSE.id,
        CourseChangeRequestKind.QUIZ_DELETE,
        OWNER.userId,
      );
      expect(result).toBeUndefined();
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

  describe('findTimelineByLessonId', () => {
    it('groups questions from the same quiz and timestamp into one marker', async () => {
      lessonActivityModel.findAll
        .mockResolvedValueOnce([{ id: 3 }])
        .mockResolvedValueOnce([{ id: 3, title: 'Timeline activity', description: null }]);
      quizModel.findAll.mockResolvedValue([
        {
          id: 7,
          lessonActivityId: 3,
          name: 'Quiz fallback',
          isInVideo: true,
          questions: [
            { id: 11, orderIndex: 2, videoTimestamp: '00:10:00.000', quesText: 'Question B' },
            { id: 10, orderIndex: 1, videoTimestamp: '00:10:00.000', quesText: 'Question A' },
            { id: 12, orderIndex: 3, videoTimestamp: '00:20:00.000', quesText: 'Question C' },
          ],
        },
      ]);

      const result = await service.findTimelineByLessonId(2);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        quizId: 7,
        lessonActivityId: 3,
        questionIds: [10, 11],
        questionId: 10,
        questionCount: 2,
        quizName: 'Timeline activity',
        questionText: 'Question A',
        timestamp: '00:10:00.000',
        timestampLabel: '10:00',
        timestampSeconds: 600,
      });
      expect(result[1]).toMatchObject({
        questionIds: [12],
        questionCount: 1,
        timestampLabel: '20:00',
      });
    });

    it('groups different quizzes at the same timestamp into one marker with items', async () => {
      lessonActivityModel.findAll
        .mockResolvedValueOnce([{ id: 3 }, { id: 4 }])
        .mockResolvedValueOnce([
          { id: 3, title: 'Activity A', description: null },
          { id: 4, title: 'Activity B', description: null },
        ]);
      quizModel.findAll.mockResolvedValue([
        {
          id: 7,
          lessonActivityId: 3,
          name: 'Quiz A',
          isInVideo: true,
          questions: [
            { id: 10, orderIndex: 1, videoTimestamp: '00:08:00.000', quesText: 'Question A' },
          ],
        },
        {
          id: 8,
          lessonActivityId: 4,
          name: 'Quiz B',
          isInVideo: true,
          questions: [
            { id: 11, orderIndex: 1, videoTimestamp: '00:08:00.000', quesText: 'Question B' },
          ],
        },
      ]);

      const result = await service.findTimelineByLessonId(2);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        timestamp: '00:08:00.000',
        timestampLabel: '08:00',
        timestampSeconds: 480,
        questionIds: [10, 11],
        questionCount: 2,
        quizCount: 2,
      });
      expect(result[0].items).toEqual([
        expect.objectContaining({ quizId: 7, questionIds: [10], questionCount: 1 }),
        expect.objectContaining({ quizId: 8, questionIds: [11], questionCount: 1 }),
      ]);
    });

    it('skips AI review pending activities', async () => {
      lessonActivityModel.findAll
        .mockResolvedValueOnce([{ id: 3 }])
        .mockResolvedValueOnce([{ id: 3, title: 'Pending', description: 'AI_REVIEW_PENDING' }]);
      quizModel.findAll.mockResolvedValue([
        {
          id: 7,
          lessonActivityId: 3,
          name: 'Pending quiz',
          isInVideo: true,
          questions: [
            { id: 10, orderIndex: 1, videoTimestamp: '00:10:00.000', quesText: 'Question A' },
          ],
        },
      ]);

      await expect(service.findTimelineByLessonId(2)).resolves.toEqual([]);
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
