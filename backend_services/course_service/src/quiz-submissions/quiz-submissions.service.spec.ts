import { BadRequestException } from '@nestjs/common';
import { QuizSubmissionsService } from './quiz-submissions.service';

const makeService = () =>
  new QuizSubmissionsService(
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
  ) as any;

const makeQuiz = (overrides: Record<string, unknown> = {}) => ({
  id: 10,
  isInVideo: false,
  passingScore: 70,
  questions: [
    {
      id: 101,
      quesText: '2 + 2 = ?',
      point: 2,
      explanation: '2 + 2 equals 4.',
      evidenceTimestamp: '00:00:12.500',
      options: [
        { id: 1001, optionText: '3', isCorrect: false },
        { id: 1002, optionText: '4', isCorrect: true },
      ],
    },
    {
      id: 102,
      quesText: 'Capital of Vietnam?',
      point: 3,
      explanation: 'Ha Noi is the capital city.',
      evidenceTimestamp: '00:00:20.000',
      options: [
        { id: 1003, optionText: 'Da Nang', isCorrect: false },
        { id: 1004, optionText: 'Ha Noi', isCorrect: true },
      ],
    },
  ],
  ...overrides,
});

describe('QuizSubmissionsService.gradeAnswers', () => {
  it('returns correct answer, explanation, and evidence only in submission snapshot', () => {
    const service = makeService();

    const result = service.gradeAnswers(makeQuiz(), [
      { questionId: 101, selectedOptionId: 1002 },
      { questionId: 102, selectedOptionId: 1003 },
    ]);

    expect(result.score).toBe(2);
    expect(result.maxScore).toBe(5);
    expect(result.percent).toBe(40);
    expect(result.passed).toBe(false);
    expect(result.answerSnapshots).toEqual([
      expect.objectContaining({
        questionId: 101,
        selectedOptionId: 1002,
        correctOptionId: 1002,
        correctOptionText: '4',
        isCorrect: true,
        point: 2,
        maxPoint: 2,
        explanation: '2 + 2 equals 4.',
        evidenceTimestamp: '00:00:12.500',
      }),
      expect.objectContaining({
        questionId: 102,
        selectedOptionId: 1003,
        correctOptionId: 1004,
        correctOptionText: 'Ha Noi',
        isCorrect: false,
        point: 0,
        maxPoint: 3,
        explanation: 'Ha Noi is the capital city.',
        evidenceTimestamp: '00:00:20.000',
      }),
    ]);
  });

  it('grades in-video quiz against submitted questions only', () => {
    const service = makeService();

    const result = service.gradeAnswers(makeQuiz({ isInVideo: true }), [
      { questionId: 101, selectedOptionId: 1002 },
    ]);

    expect(result.score).toBe(2);
    expect(result.maxScore).toBe(2);
    expect(result.percent).toBe(100);
    expect(result.passed).toBe(true);
    expect(result.answerSnapshots).toHaveLength(1);
  });

  it('rejects duplicate answers for the same question', () => {
    const service = makeService();

    expect(() =>
      service.gradeAnswers(makeQuiz(), [
        { questionId: 101, selectedOptionId: 1002 },
        { questionId: 101, selectedOptionId: 1001 },
      ]),
    ).toThrow(BadRequestException);
  });

  it('rejects selected options that do not belong to the answered question', () => {
    const service = makeService();

    expect(() =>
      service.gradeAnswers(makeQuiz(), [
        { questionId: 101, selectedOptionId: 1004 },
      ]),
    ).toThrow(BadRequestException);
  });
});