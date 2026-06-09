import { NotFoundException } from '@nestjs/common';
import { getConnectionToken, getModelToken } from '@nestjs/sequelize';
import { Test, TestingModule } from '@nestjs/testing';
import { Op } from 'sequelize';

import { Course, CourseStatus } from '../models/course.model';
import { Lesson, LessonStatus } from '../models/lesson.model';
import {
  LessonActivity,
  ActivityStatus,
} from '../models/lesson-activity.model';
import { Quiz } from '../models/quiz.model';
import { QuizQuestion } from '../models/quiz-question.model';
import { QuizOption } from '../models/quiz-option.model';
import { Enroll } from '../models/enroll.model';
import { Feedback } from '../models/feedback.model';
import { InstructorFollow } from '../models/instructor-follow.model';
import { Video } from '../models/video.model';
import { CourseChangeRequest } from '../models/course-change-request.model';
import { InstructorFollow } from '../models/instructor-follow.model';
import { AuditLogsService } from '../audit_logs/audit-logs.service';
import { EnrollsService } from '../enrolls/enrolls.service';

import { CoursesService } from './course.service';

type Mock<T = any> = jest.Mock<T>;

interface ModelMock {
  findByPk: Mock;
  findOne: Mock;
  findAll: Mock;
  findAndCountAll: Mock;
  count: Mock;
  create: Mock;
  update: Mock;
}

const makeModelMock = (): ModelMock => ({
  findByPk: jest.fn(),
  findOne: jest.fn(),
  findAll: jest.fn(),
  findAndCountAll: jest.fn(),
  count: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
});

describe('CoursesService.findOne (eager-load include tree)', () => {
  let service: CoursesService;
  let courseModel: ModelMock;
  let videoModel: ModelMock;
  let lessonModel: ModelMock;
  let enrollModel: ModelMock;
  let feedbackModel: ModelMock;

  beforeEach(async () => {
    courseModel = makeModelMock();
    videoModel = makeModelMock();
    lessonModel = makeModelMock();
    enrollModel = makeModelMock();
    feedbackModel = makeModelMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoursesService,
        { provide: getModelToken(Course), useValue: courseModel },
        { provide: getModelToken(Video), useValue: videoModel },
        { provide: getModelToken(Lesson), useValue: lessonModel },
        { provide: getModelToken(Enroll), useValue: enrollModel },
        { provide: getModelToken(Feedback), useValue: feedbackModel },
        { provide: getModelToken(InstructorFollow), useValue: makeModelMock() },
        {
          provide: getModelToken(CourseChangeRequest),
          useValue: makeModelMock(),
        },
        { provide: getModelToken(InstructorFollow), useValue: makeModelMock() },
        {
          provide: getConnectionToken(),
          useValue: {
            transaction: jest.fn((cb: (t: unknown) => unknown) => cb({})),
          },
        },
        { provide: AuditLogsService, useValue: { log: jest.fn() } },
        {
          provide: EnrollsService,
          useValue: { reconcileCourseEnrollProgress: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<CoursesService>(CoursesService);
  });

  it('ném 404 khi course không tồn tại', async () => {
    courseModel.findByPk.mockResolvedValueOnce(null);
    await expect(service.findOne(123)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('gọi findByPk đúng 1 lần với include tree đầy đủ', async () => {
    const fakeCourse = {
      id: 1,
      name: 'Test',
      description: 'desc',
      video: {
        id: 9,
        url: 'https://x',
        duration: 10,
        thumbnail: 't',
        type: 'long',
      },
      lessons: [],
    };
    courseModel.findByPk.mockResolvedValueOnce(fakeCourse);

    const result = await service.findOne(1);

    expect(result).toBe(fakeCourse);
    expect(courseModel.findByPk).toHaveBeenCalledTimes(1);

    const [pk, opts] = courseModel.findByPk.mock.calls[0];
    expect(pk).toBe(1);
    expect(opts).toBeDefined();
    expect(opts.subQuery).toBe(false);
    expect(Array.isArray(opts.include)).toBe(true);

    // Phải có 2 nhánh ở level 0: Video (preview) + Lessons
    expect(opts.include).toHaveLength(2);

    const videoLeaf = opts.include.find(
      (i: any) => i.model === Video && i.as === 'video',
    );
    expect(videoLeaf).toBeDefined();
    expect(videoLeaf.required).toBe(false);

    const lessonsBranch = opts.include.find((i: any) => i.model === Lesson);
    expect(lessonsBranch).toBeDefined();
    expect(lessonsBranch.as).toBe('lessons');
    // Lessons phải lọc bỏ REMOVED và include LessonActivities + Video
    expect(lessonsBranch.where).toBeDefined();
    expect(lessonsBranch.where.status[Op.ne]).toBe(LessonStatus.REMOVED);
    expect(Array.isArray(lessonsBranch.include)).toBe(true);

    const lessonVideo = lessonsBranch.include.find(
      (i: any) => i.model === Video,
    );
    expect(lessonVideo).toBeDefined();

    const activitiesBranch = lessonsBranch.include.find(
      (i: any) => i.model === LessonActivity && i.as === 'lessonActivities',
    );
    expect(activitiesBranch).toBeDefined();
    expect(activitiesBranch.where.status[Op.ne]).toBe(ActivityStatus.REMOVED);

    const quizzesBranch = activitiesBranch.include.find(
      (i: any) => i.model === Quiz && i.as === 'quizzes',
    );
    expect(quizzesBranch).toBeDefined();

    const questionsBranch = quizzesBranch.include.find(
      (i: any) => i.model === QuizQuestion && i.as === 'questions',
    );
    expect(questionsBranch).toBeDefined();

    const optionsLeaf = questionsBranch.include.find(
      (i: any) => i.model === QuizOption && i.as === 'options',
    );
    expect(optionsLeaf).toBeDefined();
  });

  it('include tree gắn `attributes` cụ thể (tránh load cột thừa)', async () => {
    courseModel.findByPk.mockResolvedValueOnce({ id: 1, lessons: [] });
    await service.findOne(1);

    const opts = courseModel.findByPk.mock.calls[0][1];
    const lessonsBranch = opts.include.find((i: any) => i.model === Lesson);
    const activitiesBranch = lessonsBranch.include.find(
      (i: any) => i.model === LessonActivity,
    );
    const quizzesBranch = activitiesBranch.include.find(
      (i: any) => i.model === Quiz,
    );
    const questionsBranch = quizzesBranch.include.find(
      (i: any) => i.model === QuizQuestion,
    );
    const optionsLeaf = questionsBranch.include.find(
      (i: any) => i.model === QuizOption,
    );

    expect(Array.isArray(lessonsBranch.attributes)).toBe(true);
    expect(lessonsBranch.attributes).toEqual(
      expect.arrayContaining([
        'id',
        'courseId',
        'videoId',
        'title',
        'contentType',
        'duration',
      ]),
    );

    expect(Array.isArray(activitiesBranch.attributes)).toBe(true);
    expect(activitiesBranch.attributes).toEqual(
      expect.arrayContaining(['id', 'lessonId', 'activityType', 'orderIndex']),
    );

    expect(Array.isArray(quizzesBranch.attributes)).toBe(true);
    expect(quizzesBranch.attributes).toEqual(
      expect.arrayContaining(['id', 'lessonActivityId', 'name', 'isInVideo']),
    );

    expect(Array.isArray(questionsBranch.attributes)).toBe(true);
    expect(questionsBranch.attributes).toEqual(
      expect.arrayContaining([
        'id',
        'quizId',
        'quesType',
        'quesText',
        'orderIndex',
      ]),
    );

    expect(Array.isArray(optionsLeaf.attributes)).toBe(true);
    expect(optionsLeaf.attributes).toEqual(
      expect.arrayContaining([
        'id',
        'questionId',
        'optionText',
        'isCorrect',
        'orderIndex',
      ]),
    );
  });

  it('giữ nguyên public contract: response include đủ nested data', async () => {
    const fakeCourse = {
      id: 7,
      name: 'C',
      description: 'd',
      categories: ['a'],
      level: 'Beginner',
      duration: '00:30:00.000',
      language: 'vi',
      price: 0,
      userId: 9,
      status: 'publish',
      video: { id: 9, url: 'u', duration: 5, thumbnail: 't', type: 'long' },
      lessons: [
        {
          id: 100,
          courseId: 7,
          videoId: 50,
          title: 'L1',
          contentType: 'video',
          status: 'active',
          duration: '00:10:00.000',
          video: { id: 50, url: 'u', duration: 600, thumbnail: 't' },
          lessonActivities: [
            {
              id: 1000,
              lessonId: 100,
              activityType: 'quiz',
              title: 'A1',
              status: 'public',
              orderIndex: 1,
              quizzes: [
                {
                  id: 5000,
                  lessonActivityId: 1000,
                  name: 'Q1',
                  isInVideo: false,
                  questions: [
                    {
                      id: 60000,
                      quizId: 5000,
                      quesText: 'q?',
                      quesType: 'mcq',
                      orderIndex: 1,
                      options: [
                        {
                          id: 1,
                          questionId: 60000,
                          optionText: 'a',
                          isCorrect: false,
                          orderIndex: 1,
                        },
                        {
                          id: 2,
                          questionId: 60000,
                          optionText: 'b',
                          isCorrect: true,
                          orderIndex: 2,
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };
    courseModel.findByPk.mockResolvedValueOnce(fakeCourse);

    const result: any = await service.findOne(7);

    // Public contract: top-level Course fields giữ nguyên (id, name, description, ...)
    expect(result.id).toBe(7);
    expect(result.name).toBe('C');
    expect(result.description).toBe('d');
    expect(result.video).toBeDefined();

    // Nested chain phải đến tận QuizOption
    expect(result.lessons).toHaveLength(1);
    expect(
      result.lessons[0].lessonActivities[0].quizzes[0].questions[0].options,
    ).toHaveLength(2);
    expect(
      result.lessons[0].lessonActivities[0].quizzes[0].questions[0].options[1]
        .isCorrect,
    ).toBe(true);
  });

  it('create maps thumbnail_url to thumbnailUrl model field', async () => {
    const dto = {
      name: 'Course with thumbnail',
      description: 'desc',
      thumbnail_url: ' https://cdn.example.com/thumb.png ',
      categories: ['programming'],
      language: 'vi',
      price: 100,
    };
    courseModel.create.mockResolvedValueOnce({ id: 22 });
    courseModel.findByPk.mockResolvedValueOnce({ id: 22, ...dto });

    await service.create(dto as any, 5);

    const payload = courseModel.create.mock.calls[0][0];
    expect(payload).toEqual(
      expect.objectContaining({
        thumbnailUrl: 'https://cdn.example.com/thumb.png',
        userId: 5,
        status: CourseStatus.DRAFT,
      }),
    );
    expect(payload).not.toHaveProperty('thumbnail_url');
  });

  it('update maps thumbnailUrl and allows clearing with an empty string', async () => {
    const update = jest
      .fn()
      .mockResolvedValueOnce({ id: 1, thumbnailUrl: null });
    courseModel.findByPk.mockResolvedValueOnce({
      id: 1,
      status: CourseStatus.DRAFT,
      update,
    });

    await service.update(1, { thumbnailUrl: '' }, { userId: 5, role: 1 });

    expect(update).toHaveBeenCalledWith({
      thumbnailUrl: null,
      status: CourseStatus.DRAFT,
    });
  });

  it('public course list defaults to published courses only', async () => {
    courseModel.findAll.mockResolvedValueOnce([]);

    await service.findAllPublic();

    expect(courseModel.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: CourseStatus.PUBLISH },
      }),
    );
  });

  it('rejects non-admin course list status filters outside publish', async () => {
    await expect(
      service.findAllPublic({ status: CourseStatus.PENDING }),
    ).rejects.toThrow('Only admin can filter courses by this status');
  });

  it('allows admin to filter courses by status and lecturer userId', async () => {
    courseModel.findAll.mockResolvedValueOnce([]);

    await service.findAllPublic({
      status: CourseStatus.PENDING,
      userId: 42,
      requesterRole: 1,
    });

    expect(courseModel.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          status: CourseStatus.PENDING,
          userId: 42,
        },
      }),
    );
  });

  it('searchPublishedCourses returns categories from search rows', async () => {
    const makeSearchRow = (plain: Record<string, unknown>) => ({
      get: jest.fn().mockReturnValue(plain),
    });
    const rows = [
      makeSearchRow({
        id: 1,
        name: 'React Basics',
        thumbnailUrl: null,
        price: 0,
        level: 'Beginner',
        language: 'vi',
        duration: '01:00:00.000',
        categories: ['Frontend', 'React', 'React'],
        status: CourseStatus.PUBLISH,
        avgRating: '4.5',
        reviewCount: '10',
        enrollCount: '20',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        instructor: {
          firstName: 'Ada',
          lastName: 'Lovelace',
          avatarUrl: 'avatar.png',
        },
      }),
      makeSearchRow({
        id: 2,
        name: 'TypeScript Basics',
        thumbnailUrl: 'thumb.png',
        price: 100,
        level: 'Intermediate',
        language: 'en',
        duration: '02:00:00.000',
        categories: JSON.stringify(['Frontend', 'TypeScript']),
        status: CourseStatus.PUBLISH,
        avgRating: '5',
        reviewCount: '5',
        enrollCount: '15',
        createdAt: new Date('2026-01-02T00:00:00.000Z'),
        instructor: {
          firstName: 'Grace',
          lastName: 'Hopper',
          avatarUrl: null,
        },
      }),
    ];

    courseModel.findAll
      .mockResolvedValueOnce(rows)
      .mockResolvedValueOnce([{ id: 1 }, { id: 2 }])
      .mockResolvedValueOnce([
        { categories: ['Backend'] },
        { categories: ['Frontend', 'React'] },
        { categories: ['TypeScript'] },
      ]);

    const result: any = await service.searchPublishedCourses({});

    expect(courseModel.findAll.mock.calls[0][0].attributes).toEqual(
      expect.arrayContaining(['categories']),
    );
    expect(result.data).toHaveLength(2);
    expect(result.categories).toEqual([
      { id: 2, name: 'Frontend', courseCount: 2 },
      { id: 3, name: 'React', courseCount: 1 },
      { id: 4, name: 'TypeScript', courseCount: 1 },
    ]);
  });
});
