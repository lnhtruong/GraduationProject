import { NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/sequelize';
import { Test, TestingModule } from '@nestjs/testing';
import { Op } from 'sequelize';

import { Course } from '../models/course.model';
import { Lesson, LessonStatus } from '../models/lesson.model';
import { LessonActivity, ActivityStatus } from '../models/lesson-activity.model';
import { Quiz } from '../models/quiz.model';
import { QuizQuestion } from '../models/quiz-question.model';
import { QuizOption } from '../models/quiz-option.model';
import { Enroll } from '../models/enroll.model';
import { Feedback } from '../models/feedback.model';
import { Video } from '../models/video.model';

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
      ],
    }).compile();

    service = module.get<CoursesService>(CoursesService);
  });

  it('ném 404 khi course không tồn tại', async () => {
    courseModel.findByPk.mockResolvedValueOnce(null);
    await expect(service.findOne(123)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('gọi findByPk đúng 1 lần với include tree đầy đủ', async () => {
    const fakeCourse = {
      id: 1,
      name: 'Test',
      description: 'desc',
      video: { id: 9, url: 'https://x', duration: 10, thumbnail: 't', type: 'long' },
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

    const videoLeaf = opts.include.find((i: any) => i.model === Video && i.as === 'video');
    expect(videoLeaf).toBeDefined();
    expect(videoLeaf.required).toBe(false);

    const lessonsBranch = opts.include.find((i: any) => i.model === Lesson);
    expect(lessonsBranch).toBeDefined();
    expect(lessonsBranch.as).toBe('lessons');
    // Lessons phải lọc bỏ REMOVED và include LessonActivities + Video
    expect(lessonsBranch.where).toBeDefined();
    expect(lessonsBranch.where.status[Op.ne]).toBe(LessonStatus.REMOVED);
    expect(Array.isArray(lessonsBranch.include)).toBe(true);

    const lessonVideo = lessonsBranch.include.find((i: any) => i.model === Video);
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
    const quizzesBranch = activitiesBranch.include.find((i: any) => i.model === Quiz);
    const questionsBranch = quizzesBranch.include.find(
      (i: any) => i.model === QuizQuestion,
    );
    const optionsLeaf = questionsBranch.include.find((i: any) => i.model === QuizOption);

    expect(Array.isArray(lessonsBranch.attributes)).toBe(true);
    expect(lessonsBranch.attributes).toEqual(
      expect.arrayContaining(['id', 'courseId', 'videoId', 'title', 'contentType', 'duration']),
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
      expect.arrayContaining(['id', 'quizId', 'quesType', 'quesText', 'orderIndex']),
    );

    expect(Array.isArray(optionsLeaf.attributes)).toBe(true);
    expect(optionsLeaf.attributes).toEqual(
      expect.arrayContaining(['id', 'questionId', 'optionText', 'isCorrect', 'orderIndex']),
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
                        { id: 1, questionId: 60000, optionText: 'a', isCorrect: false, orderIndex: 1 },
                        { id: 2, questionId: 60000, optionText: 'b', isCorrect: true, orderIndex: 2 },
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
    expect(result.lessons[0].lessonActivities[0].quizzes[0].questions[0].options).toHaveLength(2);
    expect(
      result.lessons[0].lessonActivities[0].quizzes[0].questions[0].options[1].isCorrect,
    ).toBe(true);
  });
});
