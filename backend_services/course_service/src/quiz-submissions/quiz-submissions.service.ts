import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { fn, col, literal, Op, Transaction } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Course, CourseStatus } from 'src/models/course.model';
import { Enroll, EnrollStatus } from 'src/models/enroll.model';
import {
  ActivityStatus,
  ActivityType,
  LessonActivity,
} from 'src/models/lesson-activity.model';
import { Lesson, LessonStatus } from 'src/models/lesson.model';
import { Quiz } from 'src/models/quiz.model';
import { QuizQuestion } from 'src/models/quiz-question.model';
import { QuizOption } from 'src/models/quiz-option.model';
import { QuizSubmission } from 'src/models/quiz-submission.model';
import { QuizzesService } from 'src/quizzes/quizzes.service';
import { GetQuizSubmissionsAdminQueryDto } from './dto/get-quiz-submissions-admin-query.dto';
import { SubmitQuizDto } from './dto/submit-quiz.dto';
import {
  PaginatedResponseDto,
  PaginationMetaDto,
} from 'src/models/pagination.dto';
import {
  QuizSubmissionAnswerSnapshot,
  QuizSubmissionContext,
  QuizSubmissionStats,
} from './quiz-submission.types';

const ADMIN_ROLE = 1;
const LECTURER_ROLE = 3;

@Injectable()
export class QuizSubmissionsService {
  constructor(
    @InjectModel(QuizSubmission)
    private readonly submissionModel: typeof QuizSubmission,
    @InjectModel(LessonActivity)
    private readonly lessonActivityModel: typeof LessonActivity,
    @InjectModel(Lesson)
    private readonly lessonModel: typeof Lesson,
    @InjectModel(Course)
    private readonly courseModel: typeof Course,
    @InjectModel(Enroll)
    private readonly enrollModel: typeof Enroll,
    @InjectConnection()
    private readonly sequelize: Sequelize,
    private readonly quizzesService: QuizzesService,
  ) { }

  async submit(
    userId: number,
    userRole: number,
    payload: SubmitQuizDto,
  ): Promise<QuizSubmission> {
    return await this.sequelize.transaction(async (transaction) => {
      const context = await this.loadQuizContext(payload.quizId, transaction);
      await this.ensureUserCanSubmitQuiz(userId, userRole, context, transaction);
      await this.ensureAttemptsAllowed(userId, context, transaction);

      const graded = this.gradeAnswers(context.quiz, payload.answers);

      const row = await this.submissionModel.create(
        {
          quizId: payload.quizId,
          userId,
          score: graded.score,
          maxScore: graded.maxScore,
          percent: graded.percent,
          passed: graded.passed,
          timeSpentSeconds: payload.timeSpentSeconds ?? null,
          answers: graded.answerSnapshots,
        },
        { transaction },
      );

      return this.findById(row.id, transaction);
    });
  }

  async findMine(
    userId: number,
    userRole: number,
    quizId?: number,
  ): Promise<QuizSubmission[]> {
    if (quizId !== undefined) {
      const context = await this.loadQuizContext(quizId);
      await this.ensureUserCanViewSubmissions(userId, userRole, context);
    }

    const where: Record<string, unknown> = { userId };
    if (quizId !== undefined) {
      where.quizId = quizId;
    }

    return await this.submissionModel.findAll({
      where,
      include: [{ model: Quiz, as: 'quiz', required: false }],
      order: [['id', 'DESC']],
    });
  }

  async findAllForAdmin(
    query: GetQuizSubmissionsAdminQueryDto,
  ): Promise<PaginatedResponseDto<QuizSubmission>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const offset = (page - 1) * limit;

    const where: Record<string, number> = {};
    if (query.quizId !== undefined) {
      where.quizId = query.quizId;
    }
    if (query.userId !== undefined) {
      where.userId = query.userId;
    }

    const { rows, count } = await this.submissionModel.findAndCountAll({
      where,
      include: [{ model: Quiz, as: 'quiz', required: false }],
      order: [['id', 'DESC']],
      limit,
      offset,
    });

    return new PaginatedResponseDto(
      rows,
      new PaginationMetaDto(page, limit, count),
    );
  }

  async getStatsForQuiz(
    quizId: number,
    requesterId: number,
    requesterRole: number,
  ): Promise<QuizSubmissionStats> {
    const context = await this.loadQuizContext(quizId);
    await this.ensureCanViewQuizStats(requesterId, requesterRole, context);

    const aggregate = await this.submissionModel.findOne({
      attributes: [
        [fn('COUNT', col('id')), 'totalSubmissions'],
        [fn('COUNT', fn('DISTINCT', col('user_id'))), 'totalUsersAttempted'],
        [fn('AVG', col('percent')), 'avgPercent'],
        [fn('MAX', col('percent')), 'highestPercent'],
        [fn('MIN', col('percent')), 'lowestPercent'],
        [
          literal('SUM(CASE WHEN passed = 1 THEN 1 ELSE 0 END)'),
          'passedCount',
        ],
        [
          literal('SUM(CASE WHEN passed = 0 THEN 1 ELSE 0 END)'),
          'failedCount',
        ],
        [
          literal(
            'SUM(CASE WHEN passed = 1 THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(id), 0)',
          ),
          'passRate',
        ],
        [fn('AVG', col('time_spent_seconds')), 'avgTimeSeconds'],
      ],
      where: { quizId },
      raw: true,
    });

    const row = (aggregate ?? {}) as Record<string, unknown>;
    const totalSubmissions = this.toInt(row.totalSubmissions);

    return {
      totalSubmissions,
      totalUsersAttempted: this.toInt(row.totalUsersAttempted),
      avgPercent: this.toNullableNumber(row.avgPercent),
      highestPercent: this.toNullableNumber(row.highestPercent),
      lowestPercent: this.toNullableNumber(row.lowestPercent),
      passedCount: this.toInt(row.passedCount),
      failedCount: this.toInt(row.failedCount),
      passRate: this.toNullableNumber(row.passRate),
      avgTimeSeconds: this.toNullableNumber(row.avgTimeSeconds),
      attemptPolicy: 'ALL_ATTEMPTS',
      maxAttempts: this.resolveMaxAttempts(context.activity.maxAttempts),
    };
  }

  private async loadQuizContext(
    quizId: number,
    transaction?: Transaction,
  ): Promise<QuizSubmissionContext> {
    let quiz = await this.quizzesService.findOne(quizId, { transaction });
    quiz = quiz.toJSON();
    // console.log('check quiz: ', quiz);
    console.log('check quiz.lessonasfn: ', quiz.lessonActivityId);

    const activity = await this.lessonActivityModel.findByPk(
      quiz.lessonActivityId,
      { transaction, raw: true },
    );
    if (!activity || activity.status === ActivityStatus.REMOVED) {
      throw new NotFoundException(
        `Lesson activity for quiz ${quizId} not found`,
      );
    }

    if (!activity.lessonId) {
      throw new BadRequestException(
        'Quiz activity is not linked to a lesson.',
      );
    }

    const lesson = await this.lessonModel.findByPk(activity.lessonId, {
      transaction,
      raw: true,
    });
    if (!lesson) {
      throw new NotFoundException(
        `Lesson ${activity.lessonId} for quiz ${quizId} not found`,
      );
    }

    if (!lesson.courseId) {
      throw new BadRequestException('Lesson is not linked to a course.');
    }

    const course = await this.courseModel.findByPk(lesson.courseId, {
      transaction,
      raw: true,
    });
    if (!course) {
      throw new NotFoundException(
        `Course ${lesson.courseId} for quiz ${quizId} not found`,
      );
    }

    return { quiz, activity, lesson, course };
  }

  private async ensureUserCanSubmitQuiz(
    userId: number,
    userRole: number,
    context: QuizSubmissionContext,
    transaction?: Transaction,
  ): Promise<void> {
    this.assertQuizActivitySubmittable(context);

    if (userRole === ADMIN_ROLE) {
      return;
    }

    if (
      userRole === LECTURER_ROLE &&
      context.course.userId === userId
    ) {
      return;
    }

    this.assertCourseAndLessonAccessible(context);
    await this.assertActiveEnrollment(userId, context.course.id, transaction);
  }

  private async ensureUserCanViewSubmissions(
    userId: number,
    userRole: number,
    context: QuizSubmissionContext,
  ): Promise<void> {
    if (userRole === ADMIN_ROLE) {
      return; //pass qua cho xem được
    }
    if (userRole === LECTURER_ROLE && context.course.userId === userId) {
      return;
    }
    this.assertCourseAndLessonAccessible(context);
    await this.assertActiveEnrollment(userId, context.course.id);
  }

  private async ensureCanViewQuizStats(
    requesterId: number,
    requesterRole: number,
    context: QuizSubmissionContext,
  ): Promise<void> {
    if (requesterRole === ADMIN_ROLE) {
      return;
    }
    if (
      requesterRole === LECTURER_ROLE &&
      context.course.userId === requesterId
    ) {
      return;
    }
    throw new ForbiddenException(
      'You can only view stats for quizzes in your own courses.',
    );
  }

  private assertQuizActivitySubmittable(context: QuizSubmissionContext): void {
    const { activity } = context;
    console.log('check activity: ', activity);

    if (activity.activityType !== ActivityType.QUIZ) {
      throw new BadRequestException(
        'This lesson activity is not a quiz.',
      );
    }

    if (activity.status !== ActivityStatus.PUBLIC) {
      throw new ForbiddenException(
        `Quiz is not available for submission (activity status: ${activity.status}).`,
      );
    }
  }

  private assertCourseAndLessonAccessible(
    context: QuizSubmissionContext,
  ): void {
    if (context.course.status !== CourseStatus.PUBLISH) {
      throw new ForbiddenException(
        'Course is not published. Quiz submission is not allowed.',
      );
    }

    if (context.lesson.status !== LessonStatus.ACTIVE) {
      throw new ForbiddenException(
        'Lesson is not available. Quiz submission is not allowed.',
      );
    }
  }

  private async assertActiveEnrollment(
    userId: number,
    courseId: number,
    transaction?: Transaction,
  ): Promise<void> {
    const enroll = await this.enrollModel.findOne({
      where: {
        userId,
        courseId,
        status: { [Op.in]: [EnrollStatus.ACTIVE, EnrollStatus.COMPLETED] },
      },
      transaction,
    });

    if (!enroll) {
      throw new ForbiddenException(
        'You must be enrolled in this course to submit the quiz.',
      );
    }
  }

  private async ensureAttemptsAllowed(
    userId: number,
    context: QuizSubmissionContext,
    transaction?: Transaction,
  ): Promise<void> {
    const maxAttempts = this.resolveMaxAttempts(context.activity.maxAttempts);
    if (maxAttempts === null) {
      return;
    }

    const usedAttempts = await this.submissionModel.count({
      where: { quizId: context.quiz.id, userId },
      transaction,
    });

    if (usedAttempts >= maxAttempts) {
      throw new ConflictException(
        `Maximum attempts (${maxAttempts}) reached for this quiz.`,
      );
    }
  }

  /**
   * null/0/negative → unlimited attempts
   */
  private resolveMaxAttempts(value: number | null | undefined): number | null {
    if (value === null || value === undefined) {
      return null;
    }
    const n = Number(value);
    if (!Number.isInteger(n) || n <= 0) {
      return null;
    }
    return n;
  }

  private async findById(
    id: number,
    transaction?: Transaction,
  ): Promise<QuizSubmission> {
    const submission = await this.submissionModel.findByPk(id, {
      include: [{ model: Quiz, as: 'quiz', required: false }],
      transaction,
    });
    if (!submission) {
      throw new NotFoundException(`Quiz submission ${id} not found`);
    }
    return submission;
  }

  private gradeAnswers(
    quiz: Quiz,
    answers: SubmitQuizDto['answers'],
  ): {
    score: number;
    maxScore: number;
    percent: number | null;
    passed: boolean;
    answerSnapshots: QuizSubmissionAnswerSnapshot[];
  } {
    const questions = quiz.questions ?? [];
    if (!questions.length) {
      throw new BadRequestException('Quiz has no questions to grade.');
    }

    const questionById = new Map<number, QuizQuestion>();
    const optionById = new Map<
      number,
      { option: QuizOption; questionId: number }
    >();

    for (const question of questions) {
      questionById.set(question.id, question);
      for (const option of question.options ?? []) {
        optionById.set(option.id, { option, questionId: question.id });
      }
    }

    const seenQuestionIds = new Set<number>();
    const answerSnapshots: QuizSubmissionAnswerSnapshot[] = [];
    let score = 0;

    for (const answer of answers) {
      if (seenQuestionIds.has(answer.questionId)) {
        throw new BadRequestException(
          `Duplicate answer for question ${answer.questionId}.`,
        );
      }
      seenQuestionIds.add(answer.questionId);

      const question = questionById.get(answer.questionId);
      if (!question) {
        throw new BadRequestException(
          `Question ${answer.questionId} does not belong to quiz ${quiz.id}.`,
        );
      }

      const selected = optionById.get(answer.selectedOptionId);
      if (!selected || selected.questionId !== question.id) {
        throw new BadRequestException(
          `Option ${answer.selectedOptionId} is not valid for question ${answer.questionId}.`,
        );
      }

      const snapshot = this.buildAnswerSnapshot(question, selected.option);
      answerSnapshots.push(snapshot);
      score += snapshot.point;
    }

    const isPartialGrading = quiz.isInVideo === true;
    const gradedQuestions = isPartialGrading
      ? questions.filter((q) => seenQuestionIds.has(q.id))
      : questions;

    const maxScore = gradedQuestions.reduce(
      (sum, q) => sum + this.toPoints(q.point),
      0,
    );

    const totalQuestions = gradedQuestions.length;
    const correctCount = answerSnapshots.filter((a) => a.isCorrect).length;

    const percent =
      maxScore > 0
        ? this.round2((score / maxScore) * 100)
        : this.round2((correctCount / totalQuestions) * 100);

    const passed = this.resolvePassed(quiz.passingScore, percent);

    return {
      score: this.round2(score),
      maxScore: this.round2(maxScore),
      percent,
      passed,
      answerSnapshots,
    };
  }

  private buildAnswerSnapshot(
    question: QuizQuestion,
    selectedOption: QuizOption,
  ): QuizSubmissionAnswerSnapshot {
    const options = question.options ?? [];
    const correctOption = options.find((o) => o.isCorrect === true);
    const maxPoint = this.toPoints(question.point);
    const isCorrect = selectedOption.isCorrect === true;

    return {
      questionId: question.id,
      questionText: question.quesText,
      selectedOptionId: selectedOption.id,
      selectedOptionText: selectedOption.optionText,
      correctOptionId: correctOption?.id ?? null,
      correctOptionText: correctOption?.optionText ?? null,
      isCorrect,
      point: isCorrect ? maxPoint : 0,
      maxPoint,
    };
  }

  private resolvePassed(
    passingScore: number | null | undefined,
    percent: number,
  ): boolean {
    if (passingScore === null || passingScore === undefined) {
      return true;
    }
    // if (percent === null) {
    //   return true;
    // }
    return percent >= Number(passingScore);
  }

  private toPoints(value: number | string | null | undefined): number {
    const n = Number(value ?? 0);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }

  private round2(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private toInt(value: unknown): number {
    const n = Number(value ?? 0);
    return Number.isFinite(n) ? Math.trunc(n) : 0;
  }

  private toNullableNumber(value: unknown): number | null {
    if (value === null || value === undefined) return null;
    const n = Number(value);
    return Number.isFinite(n) ? this.round2(n) : null;
  }
}
