import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Quiz } from 'src/models/quiz.model';
import { QuizQuestion } from 'src/models/quiz-question.model';
import { QuizOption } from 'src/models/quiz-option.model';
import { Video } from 'src/models/video.model';
import { LessonActivity } from 'src/models/lesson-activity.model';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { CreateQuizAIDto } from './dto/create-quiz-ai.dto';
import {
  CreateQuizFromAIDto,
  QuizQuestionFromAIDto,
} from './dto/create-quiz-from-ai.dto';
import { FilterQuizQuestionsDto } from './dto/filter-quiz-questions.dto';
import { RestoreQuizQuestionsDto } from './dto/restore-quiz-questions.dto';
import { QuestionType } from 'src/models/quiz-question.model';
import { CoursesService } from 'src/course/course.service';
import { CourseStatus } from 'src/models/course.model';
import {
  CourseChangeRequest,
  CourseChangeRequestKind,
  QuizChangePayload,
} from 'src/models/course-change-request.model';

const VIDEO_TIMESTAMP_REGEX = /^\d{2}:\d{2}:\d{2}[,.]\d{3}$/;
const ADMIN_ROLE = 1;

type AiQuizJobResponse = {
  jobId: string;
  status: string;
  type: 'quiz';
  lessonActivityId: number;
  videoId: number;
  quizName: string;
};

type RequesterContext = {
  requesterUserId: number;
  requesterRole: number;
};

/** Ngữ cảnh người gọi cho các thao tác sửa quiz (từ header x-user-id/role). */
type QuizRequester = {
  userId?: number;
  role?: number;
};

type ColabJobResponse = {
  job_id?: string;
  jobId?: string;
  status?: string;
  type?: string;
};

type AiQuizTimeRange = {
  startTime: number;
  endTime: number;
};

@Injectable()
export class QuizzesService {
  constructor(
    @InjectModel(Quiz) private readonly quizModel: typeof Quiz,
    @InjectModel(QuizQuestion)
    private readonly quizQuestionModel: typeof QuizQuestion,
    @InjectModel(QuizOption)
    private readonly quizOptionModel: typeof QuizOption,
    @InjectModel(Video) private readonly videoModel: typeof Video,
    @InjectModel(LessonActivity)
    private readonly lessonActivityModel: typeof LessonActivity,
    @InjectConnection() private readonly sequelize: Sequelize,
    @Inject(forwardRef(() => CoursesService))
    private readonly coursesService: CoursesService,
  ) {}

  private normalizeVideoTimestamp(value?: string | null): string | null {
    if (!value) return null;
    const normalized = value.trim().replace(',', '.');
    if (!VIDEO_TIMESTAMP_REGEX.test(normalized)) {
      throw new BadRequestException(
        `Invalid video timestamp format "${value}". Expected "HH:MM:SS,mmm" or "HH:MM:SS.mmm".`,
      );
    }
    return normalized;
  }

  private assertQuizVideoTimestampConsistency(
    isInVideo: boolean,
    questions: Array<{ videoTimestamp?: string | null }>,
  ): void {
    if (!questions.length) return;

    if (!isInVideo) {
      const hasAnyTimestamp = questions.some((q) => !!q.videoTimestamp);
      if (hasAnyTimestamp) {
        throw new BadRequestException(
          'videoTimestamp must be null for all questions when quiz.isInVideo is false.',
        );
      }
      return;
    }

    const missingTimestamp = questions.find((q) => !q.videoTimestamp);
    if (missingTimestamp) {
      throw new BadRequestException(
        'videoTimestamp is required for every question when quiz.isInVideo is true.',
      );
    }
  }

  async createOne(payload: CreateQuizDto): Promise<Quiz> {
    const isInVideo = payload.isInVideo ?? false;
    const normalizedQuestions =
      payload.questions?.map((q) => ({
        ...q,
        videoTimestamp: this.normalizeVideoTimestamp(q.videoTimestamp),
      })) ?? [];

    this.assertQuizVideoTimestampConsistency(isInVideo, normalizedQuestions);

    return await this.sequelize.transaction(async (transaction) => {
      const quiz = await this.quizModel.create(
        {
          lessonActivityId: payload.lessonActivityId,
          name: payload.name,
          shuffleQuestion: payload.shuffleQuestion ?? false,
          shuffleOption: payload.shuffleOption ?? false,
          passingScore: payload.passingScore,
          timeLimitMinutes: payload.timeLimitMinutes,
          isInVideo,
        },
        { transaction },
      );

      if (normalizedQuestions.length) {
        for (const q of normalizedQuestions) {
          const question = await this.quizQuestionModel.create(
            {
              quizId: quiz.id,
              quesType: q.quesType,
              quesText: q.quesText,
              point: q.point,
              correctAns: q.correctAns,
              orderIndex: q.orderIndex,
              videoTimestamp: q.videoTimestamp,
            },
            { transaction },
          );

          if (q.options?.length) {
            await this.quizOptionModel.bulkCreate(
              q.options.map((o) => ({
                questionId: question.id,
                optionText: o.optionText,
                isCorrect: o.isCorrect ?? false,
                orderIndex: o.orderIndex,
              })),
              { transaction },
            );
          }
        }
      }

      return await this.findOne(quiz.id, { transaction });
    });
  }

  private getAiServiceBaseUrl(): string {
    const baseUrl = process.env.AI_SERVICE_BASE_URL?.trim().replace(/\/+$/, '');
    if (!baseUrl) {
      throw new BadRequestException('AI_SERVICE_BASE_URL is not configured');
    }
    return baseUrl;
  }

  private async fetchJsonWithTimeout<T>(
    url: string,
    init: RequestInit,
    timeoutMs: number,
  ): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        ...init,
        signal: controller.signal,
        headers: {
          'ngrok-skip-browser-warning': 'true',
          ...(init.headers ?? {}),
        },
      });
      const text = await response.text();
      const data = text ? JSON.parse(text) : {};

      if (!response.ok) {
        throw new BadRequestException(data);
      }

      return data as T;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      const message = error instanceof Error ? error.message : String(error);
      throw new InternalServerErrorException(
        `AI service request failed: ${message}`,
      );
    } finally {
      clearTimeout(timer);
    }
  }

  private async assertCanUseVideoForAi(
    video: Video,
    requester: RequesterContext,
  ): Promise<void> {
    if (requester.requesterRole === ADMIN_ROLE) return;
    if (video.user_id !== requester.requesterUserId) {
      throw new ForbiddenException(
        'You can only generate quizzes from your own videos.',
      );
    }
  }

  private resolveQuizSource(video: Video): {
    field: 'srt_url' | 'long_video_url';
    value: string;
  } {
    const srtUrl = video.srt_raw_url?.trim();
    if (srtUrl) return { field: 'srt_url', value: srtUrl };

    const longVideoUrl = video.url?.trim();
    if (longVideoUrl) return { field: 'long_video_url', value: longVideoUrl };

    throw new BadRequestException(
      'Video has neither srt_raw_url nor url. Upload or transcribe the video before generating an AI quiz.',
    );
  }

  private parseOptionalAiQuizTime(
    value: unknown,
    fieldName: string,
  ): number | undefined {
    if (value === undefined || value === null) return undefined;

    if (typeof value !== 'number' && typeof value !== 'string') {
      throw new BadRequestException(
        `${fieldName} must be a non-negative number.`,
      );
    }

    const normalized = typeof value === 'string' ? value.trim() : value;
    if (normalized === '') return undefined;

    const parsed = Number(normalized);
    if (!Number.isFinite(parsed) || parsed < 0) {
      throw new BadRequestException(
        `${fieldName} must be a non-negative number.`,
      );
    }

    return parsed;
  }

  private resolveAiQuizTimeRange(
    payload: CreateQuizAIDto,
  ): AiQuizTimeRange | null {
    const startTime = this.parseOptionalAiQuizTime(
      payload.startTime ?? payload.start_time,
      'start_time',
    );
    const endTime = this.parseOptionalAiQuizTime(
      payload.endTime ?? payload.end_time,
      'end_time',
    );
    const hasStartTime = startTime !== undefined && startTime !== null;
    const hasEndTime = endTime !== undefined && endTime !== null;

    if (hasStartTime !== hasEndTime) {
      throw new BadRequestException(
        'start_time and end_time must be provided together.',
      );
    }

    if (!hasStartTime || !hasEndTime) {
      return null;
    }

    if (startTime >= endTime) {
      throw new BadRequestException('start_time must be less than end_time.');
    }

    return { startTime, endTime };
  }

  async createOneByAI(
    payload: CreateQuizAIDto,
    requester: RequesterContext,
  ): Promise<AiQuizJobResponse> {
    const video = await this.videoModel.findByPk(payload.videoId);
    if (!video) {
      throw new NotFoundException(`Video with ID ${payload.videoId} not found`);
    }

    await this.assertCanUseVideoForAi(video, requester);

    const lessonActivity = await this.lessonActivityModel.findByPk(
      payload.lessonActivityId,
      { attributes: ['id'] },
    );
    if (!lessonActivity) {
      throw new NotFoundException(
        `LessonActivity ${payload.lessonActivityId} not found`,
      );
    }

    const baseUrl = this.getAiServiceBaseUrl();
    const source = this.resolveQuizSource(video);
    const timeRange = this.resolveAiQuizTimeRange(payload);
    const quizName = payload.name?.trim() || `AI Quiz - Video ${video.id}`;
    const numQuestions = payload.numQuestions ?? 10;
    const difficulty = payload.difficulty ?? 'mixed';
    const sourceOriginalFilename =
      payload.sourceOriginalFilename?.trim() ||
      payload.name?.trim() ||
      video.name?.trim() ||
      `video-${video.id}`;

    const formData = new FormData();
    formData.append('user_id', String(requester.requesterUserId));
    formData.append(source.field, source.value);
    formData.append('source_original_filename', sourceOriginalFilename);
    formData.append('num_questions', String(numQuestions));
    formData.append('difficulty', difficulty);
    if (payload.language?.trim()) {
      formData.append('language', payload.language.trim());
    }
    formData.append('lesson_activity_id', String(payload.lessonActivityId));
    formData.append('video_id', String(payload.videoId));
    formData.append('quiz_name', quizName);
    formData.append(
      'shuffleQuestion',
      String(payload.shuffleQuestion ?? false),
    );
    formData.append('shuffleOption', String(payload.shuffleOption ?? false));
    formData.append('passingScore', String(payload.passingScore ?? 0));
    formData.append('timeLimitMinutes', String(payload.timeLimitMinutes ?? 0));
    formData.append('isInVideo', String(payload.isInVideo ?? true));
    if (timeRange) {
      formData.append('start_time', String(timeRange.startTime));
      formData.append('end_time', String(timeRange.endTime));
    }

    const response = await this.fetchJsonWithTimeout<ColabJobResponse>(
      `${baseUrl}/generate-quiz`,
      { method: 'POST', body: formData },
      60_000,
    );

    const jobId = response.job_id ?? response.jobId;
    if (!jobId) {
      throw new InternalServerErrorException(
        'AI service did not return job_id',
      );
    }

    return {
      jobId,
      status: response.status ?? 'pending',
      type: 'quiz',
      lessonActivityId: payload.lessonActivityId,
      videoId: payload.videoId,
      quizName,
    };
  }

  async createManyByAI(
    payloads: CreateQuizAIDto[],
    requester: RequesterContext,
  ): Promise<AiQuizJobResponse[]> {
    const out: AiQuizJobResponse[] = [];
    for (const p of payloads) {
      out.push(await this.createOneByAI(p, requester));
    }
    return out;
  }

  /**
   * Async insert quiz đã được Colab notebook sinh sẵn (skip OpenAI inline gen).
   *
   * Khác `createOneByAI`:
   *   - KHÔNG đọc srt_raw_url + KHÔNG gọi LLM
   *   - Trust hoàn toàn `payload.questions[]` từ Colab `validate_questions()` đã sửa
   *     timestamps về SRT thật
   *
   * Caller dự kiến: `media_service` webhook `handleAIResult` case `type=quiz`.
   */
  async createFromAI(payload: CreateQuizFromAIDto): Promise<Quiz> {
    if (!payload.questions?.length) {
      throw new BadRequestException('questions[] is required and non-empty');
    }

    const lessonActivityId = payload.lessonActivityId;
    const videoId = payload.videoId;
    const quizName = payload.name?.trim() || 'AI Quiz';

    if (!lessonActivityId) {
      throw new BadRequestException('lessonActivityId is required');
    }
    if (!videoId) {
      throw new BadRequestException('videoId is required');
    }
    const isInVideo = payload.isInVideo ?? true;

    const video = await this.videoModel.findByPk(videoId, {
      attributes: ['id'],
    });
    if (!video) {
      throw new NotFoundException(`Video ${videoId} not found`);
    }

    const lessonActivity = await this.lessonActivityModel.findByPk(
      lessonActivityId,
      { attributes: ['id'] },
    );
    if (!lessonActivity) {
      throw new NotFoundException(
        `LessonActivity ${lessonActivityId} not found`,
      );
    }

    const rows = payload.questions.map((q, idx) =>
      this.toRowFromAI(q, idx + 1),
    );
    this.assertQuizVideoTimestampConsistency(isInVideo, rows);

    return await this.sequelize.transaction(async (transaction) => {
      const quiz = await this.quizModel.create(
        {
          lessonActivityId,
          name: quizName,
          shuffleQuestion: payload.shuffleQuestion ?? false,
          shuffleOption: payload.shuffleOption ?? false,
          passingScore: payload.passingScore ?? 0,
          timeLimitMinutes: payload.timeLimitMinutes ?? 0,
          isInVideo,
        },
        { transaction },
      );

      for (const row of rows) {
        const question = await this.quizQuestionModel.create(
          {
            quizId: quiz.id,
            quesType: row.quesType,
            quesText: row.quesText,
            point: row.point,
            correctAns: row.correctAns,
            orderIndex: row.orderIndex,
            videoTimestamp: row.videoTimestamp,
          },
          { transaction },
        );
        if (row.options?.length) {
          await this.quizOptionModel.bulkCreate(
            row.options.map((o) => ({
              questionId: question.id,
              optionText: o.optionText,
              isCorrect: o.isCorrect,
              orderIndex: o.orderIndex,
            })),
            { transaction },
          );
        }
      }

      return await this.findOne(quiz.id, { transaction });
    });
  }

  private isNewColabQuestionFormat(q: QuizQuestionFromAIDto): boolean {
    return Array.isArray(q.options) || q.type != null;
  }

  private resolveEvidenceTimestamp(q: QuizQuestionFromAIDto): string | null {
    if (typeof q.evidenceTimestamp === 'string' && q.evidenceTimestamp.trim()) {
      return this.normalizeVideoTimestamp(q.evidenceTimestamp);
    }
    // Colab gửi `evidence: "HH:MM:SS,mmm"`. DTO @Transform gán evidenceTimestamp
    // nhưng class-transformer có thể overwrite lại undefined sau — đọc thẳng string.
    const rawEvidence = q.evidence as
      | string
      | QuizQuestionFromAIDto['evidence'];
    if (typeof rawEvidence === 'string' && rawEvidence.trim()) {
      return this.normalizeVideoTimestamp(rawEvidence);
    }
    if (
      rawEvidence &&
      typeof rawEvidence === 'object' &&
      rawEvidence.start_ms != null
    ) {
      return this.msToTimestamp(rawEvidence.start_ms);
    }
    return null;
  }

  private pointFromDifficulty(difficulty?: string): number {
    if (difficulty === 'hard') return 2;
    if (difficulty === 'medium') return 1.5;
    return 1;
  }

  /**
   * Colab prompt mới: `{ type, options: [{optionText,isCorrect,orderIndex}], evidence: "HH:MM:SS,mmm" }`.
   */
  private toRowFromNewColabFormat(
    q: QuizQuestionFromAIDto,
    orderIndex: number,
  ) {
    const rawOptions = Array.isArray(q.options) ? q.options : [];
    if (!rawOptions.length) {
      throw new BadRequestException(
        `Question "${q.question.slice(0, 80)}" must include at least one option.`,
      );
    }

    const options = rawOptions.map((o, i) => ({
      optionText: String(o.optionText),
      isCorrect: Boolean(o.isCorrect),
      orderIndex: o.orderIndex ?? i + 1,
    }));

    const correctCount = options.filter((o) => o.isCorrect).length;
    if (correctCount !== 1) {
      throw new BadRequestException(
        `Question "${q.question.slice(0, 80)}" must have exactly one correct option (got ${correctCount}).`,
      );
    }

    const quesType =
      q.type === 'true_false' ? QuestionType.TF : QuestionType.MULTIPLE_CHOICE;

    return {
      quesType,
      quesText: q.question,
      point: this.pointFromDifficulty(q.difficulty),
      correctAns: q.explanation ?? null,
      orderIndex,
      videoTimestamp: this.resolveEvidenceTimestamp(q),
      options,
    };
  }

  /**
   * Legacy Colab: `{ question, options:{a,b,c,d}, correct, evidence:{start_ms} }`.
   */
  private toRowFromLegacyColabFormat(
    q: QuizQuestionFromAIDto,
    orderIndex: number,
  ) {
    if (!q.correct) {
      throw new BadRequestException(
        `Legacy-format question "${q.question.slice(0, 80)}" is missing "correct".`,
      );
    }

    const optMap = (q.options ?? {}) as Record<string, string>;
    const orderedKeys: Array<'a' | 'b' | 'c' | 'd'> = ['a', 'b', 'c', 'd'];
    const options = orderedKeys
      .filter((k) => typeof optMap[k] === 'string')
      .map((k, i) => ({
        optionText: String(optMap[k]),
        isCorrect: k === q.correct,
        orderIndex: i + 1,
      }));

    if (!options.length) {
      throw new BadRequestException(
        `Legacy-format question "${q.question.slice(0, 80)}" has no options.`,
      );
    }

    return {
      quesType: QuestionType.MULTIPLE_CHOICE,
      quesText: q.question,
      point: this.pointFromDifficulty(q.difficulty),
      correctAns: q.explanation ?? null,
      orderIndex,
      videoTimestamp: this.resolveEvidenceTimestamp(q),
      options,
    };
  }

  /**
   * Convert 1 câu hỏi Colab → shape DB (`quesText`, `correctAns`, `options[].isCorrect`).
   * Hỗ trợ cả prompt mới (array options + evidence string) lẫn legacy map `{a,b,c,d}`.
   */
  private toRowFromAI(q: QuizQuestionFromAIDto, orderIndex: number) {
    if (this.isNewColabQuestionFormat(q)) {
      return this.toRowFromNewColabFormat(q, orderIndex);
    }
    return this.toRowFromLegacyColabFormat(q, orderIndex);
  }

  /** ms → "HH:MM:SS.mmm" (khớp VIDEO_TIMESTAMP_REGEX có dấu chấm). */
  private msToTimestamp(ms: number): string {
    const totalSec = Math.floor(ms / 1000);
    const milli = ms % 1000;
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return (
      String(h).padStart(2, '0') +
      ':' +
      String(m).padStart(2, '0') +
      ':' +
      String(s).padStart(2, '0') +
      '.' +
      String(milli).padStart(3, '0')
    );
  }

  async createMany(payload: CreateQuizDto[]): Promise<Quiz[]> {
    return await this.sequelize.transaction(async (transaction) => {
      const created: Quiz[] = [];
      for (const item of payload) {
        const quiz = await this.createOneWithTransaction(item, transaction);
        created.push(quiz);
      }
      return created;
    });
  }

  private async createOneWithTransaction(
    payload: CreateQuizDto,
    transaction: any,
  ): Promise<Quiz> {
    const isInVideo = payload.isInVideo ?? false;
    const normalizedQuestions =
      payload.questions?.map((q) => ({
        ...q,
        videoTimestamp: this.normalizeVideoTimestamp(q.videoTimestamp),
      })) ?? [];
    this.assertQuizVideoTimestampConsistency(isInVideo, normalizedQuestions);

    const quiz = await this.quizModel.create(
      {
        lessonActivityId: payload.lessonActivityId,
        name: payload.name,
        shuffleQuestion: payload.shuffleQuestion ?? false,
        shuffleOption: payload.shuffleOption ?? false,
        passingScore: payload.passingScore,
        timeLimitMinutes: payload.timeLimitMinutes,
        isInVideo,
      },
      { transaction },
    );

    if (normalizedQuestions.length) {
      for (const q of normalizedQuestions) {
        const question = await this.quizQuestionModel.create(
          {
            quizId: quiz.id,
            quesType: q.quesType,
            quesText: q.quesText,
            point: q.point,
            correctAns: q.correctAns,
            orderIndex: q.orderIndex,
            videoTimestamp: q.videoTimestamp,
          },
          { transaction },
        );

        if (q.options?.length) {
          await this.quizOptionModel.bulkCreate(
            q.options.map((o) => ({
              questionId: question.id,
              optionText: o.optionText,
              isCorrect: o.isCorrect ?? false,
              orderIndex: o.orderIndex,
            })),
            { transaction },
          );
        }
      }
    }

    return await this.findOne(quiz.id, { transaction });
  }

  async findAll(filter?: { lessonActivityId?: number }): Promise<Quiz[]> {
    const where: any = {};
    if (filter?.lessonActivityId)
      where.lessonActivityId = filter.lessonActivityId;

    return await this.quizModel.findAll({
      where,
      order: [['id', 'DESC']],
      include: [
        {
          model: QuizQuestion,
          as: 'questions',
          required: false,
          include: [{ model: QuizOption, as: 'options', required: false }],
        },
      ],
    });
  }

  async findAllByLessonId(
    lessonId: number,
    type?: 'in_video' | 'after_video',
  ): Promise<Quiz[]> {
    if (!Number.isInteger(lessonId) || lessonId <= 0) {
      throw new BadRequestException('lessonId must be a positive integer.');
    }

    const lessonActivities = await this.lessonActivityModel.findAll({
      attributes: ['id'],
      where: { lessonId },
    });

    if (!lessonActivities.length) {
      return [];
    }

    const lessonActivityIds = lessonActivities.map((activity) => activity.id);
    const where: any = {
      lessonActivityId: { [Op.in]: lessonActivityIds },
    };

    if (type === 'in_video') {
      where.isInVideo = true;
    } else if (type === 'after_video') {
      where.isInVideo = false;
    }

    return await this.quizModel.findAll({
      where,
      order: [['id', 'DESC']],
      include: [
        {
          model: QuizQuestion,
          as: 'questions',
          required: false,
          include: [{ model: QuizOption, as: 'options', required: false }],
        },
      ],
    });
  }

  async findOne(id: number, opts?: { transaction?: any }): Promise<Quiz> {
    const quiz = await this.quizModel.findByPk(id, {
      transaction: opts?.transaction,
      include: [
        {
          model: QuizQuestion,
          as: 'questions',
          required: false,
          include: [{ model: QuizOption, as: 'options', required: false }],
        },
      ],
      order: [[{ model: QuizQuestion, as: 'questions' }, 'orderIndex', 'ASC']],
    });

    if (!quiz) throw new NotFoundException(`Quiz with ID ${id} not found`);
    return quiz;
  }

  async update(id: number, payload: UpdateQuizDto): Promise<Quiz> {
    return await this.sequelize.transaction(async (transaction) => {
      const quiz = await this.quizModel.findByPk(id, {
        transaction,
        include: [{ model: QuizQuestion, as: 'questions', required: false }],
      });
      if (!quiz) throw new NotFoundException(`Quiz with ID ${id} not found`);

      const isInVideo = payload.isInVideo ?? quiz.isInVideo ?? false;
      const normalizedPayloadQuestions = payload.questions?.map((q) => ({
        ...q,
        videoTimestamp: this.normalizeVideoTimestamp(q.videoTimestamp),
      }));

      const consistencySource =
        normalizedPayloadQuestions ?? quiz.questions ?? [];
      this.assertQuizVideoTimestampConsistency(isInVideo, consistencySource);

      await quiz.update(
        {
          lessonActivityId: payload.lessonActivityId ?? quiz.lessonActivityId,
          name: payload.name ?? quiz.name,
          shuffleQuestion: payload.shuffleQuestion ?? quiz.shuffleQuestion,
          shuffleOption: payload.shuffleOption ?? quiz.shuffleOption,
          passingScore: payload.passingScore ?? quiz.passingScore,
          timeLimitMinutes: payload.timeLimitMinutes ?? quiz.timeLimitMinutes,
          isInVideo,
        },
        { transaction },
      );

      // If client sends questions, treat as "replace" (simple + predictable for maintainability).
      if (normalizedPayloadQuestions) {
        await this.quizQuestionModel.destroy({
          where: { quizId: id },
          transaction,
        });

        for (const q of normalizedPayloadQuestions) {
          const question = await this.quizQuestionModel.create(
            {
              quizId: id,
              quesType: q.quesType,
              quesText: q.quesText,
              point: q.point,
              correctAns: q.correctAns,
              orderIndex: q.orderIndex,
              videoTimestamp: q.videoTimestamp,
            },
            { transaction },
          );

          if (q.options?.length) {
            await this.quizOptionModel.bulkCreate(
              q.options.map((o) => ({
                questionId: question.id,
                optionText: o.optionText,
                isCorrect: o.isCorrect ?? false,
                orderIndex: o.orderIndex,
              })),
              { transaction },
            );
          }
        }
      }

      return await this.findOne(id, { transaction });
    });
  }

  async remove(id: number): Promise<void> {
    // Vì models đã `paranoid: true` → .destroy() là SOFT DELETE
    // (set `deleted_at` = NOW, không xoá vĩnh viễn).
    const quiz = await this.quizModel.findByPk(id);
    if (!quiz) throw new NotFoundException(`Quiz with ID ${id} not found`);
    await quiz.destroy();
  }

  // ───────────────────────── Change-request flow (quiz) ─────────────────────
  //
  // Khi course ĐÃ publish và người sửa KHÔNG phải admin: thao tác create/update/
  // delete quiz không áp dụng trực tiếp mà tạo một change request chờ admin
  // duyệt (giống lesson). Admin / course chưa publish → sửa trực tiếp như cũ.

  /** requestedBy bắt buộc khi tạo change request (cột requested_by NOT NULL). */
  private requireRequester(requester?: QuizRequester): number {
    const userId = requester?.userId;
    if (!userId || !Number.isInteger(userId) || userId <= 0) {
      throw new BadRequestException(
        'User ID is required to request changes on a published course',
      );
    }
    return userId;
  }

  /**
   * Xác thực quyền + quyết định cần change request hay không, theo nguyên tắc
   * 403 TRƯỚC 404: non-admin không xác nhận được là chủ khóa (course/activity
   * không tồn tại hoặc của người khác) → 403, không lộ tồn tại. Admin: full quyền.
   * Trả về courseId + cờ needsChangeRequest (course đã publish && non-admin).
   */
  private async resolveQuizCourseContext(
    lessonActivityId: number,
    requester?: QuizRequester,
  ): Promise<{ courseId: number; needsChangeRequest: boolean }> {
    const course =
      await this.coursesService.findCourseByLessonActivityId(lessonActivityId);

    if (requester?.role === ADMIN_ROLE) {
      if (!course) {
        throw new NotFoundException(
          `Course for lesson activity ${lessonActivityId} not found`,
        );
      }
      return { courseId: course.id, needsChangeRequest: false };
    }

    const ownerId = (course as { userId?: number } | null)?.userId;
    if (!course || ownerId !== requester?.userId) {
      throw new ForbiddenException('You are not the owner of this course');
    }
    return {
      courseId: course.id,
      needsChangeRequest: course.status === CourseStatus.PUBLISH,
    };
  }

  /**
   * Ảnh chụp giá trị quiz hiện tại cho đúng các field có trong `payload` (để
   * hiển thị diff khi admin duyệt). `questions` được serialize gọn lại.
   */
  private snapshotQuiz(
    quiz: Quiz,
    payload: QuizChangePayload,
  ): QuizChangePayload {
    const snapshot: Record<string, unknown> = {};
    for (const key of Object.keys(payload)) {
      if (key === 'questions') {
        snapshot.questions = (quiz.questions ?? []).map((q) => ({
          quesType: q.quesType,
          quesText: q.quesText,
          point: q.point,
          correctAns: q.correctAns,
          orderIndex: q.orderIndex,
          videoTimestamp: q.videoTimestamp,
        }));
      } else {
        snapshot[key] = quiz.get(key as keyof Quiz) ?? null;
      }
    }
    return snapshot as QuizChangePayload;
  }

  /**
   * Entry point từ controller cho `POST /quizzes`. Course đã publish (non-admin)
   * → tạo change request `quiz.create`; còn lại → createOne trực tiếp + báo học
   * viên nếu admin sửa khóa đã publish.
   */
  async createOneWithReview(
    payload: CreateQuizDto,
    requester?: QuizRequester,
  ): Promise<Quiz | CourseChangeRequest> {
    const { courseId, needsChangeRequest } =
      await this.resolveQuizCourseContext(payload.lessonActivityId, requester);

    if (needsChangeRequest) {
      return await this.coursesService.createQuizChangeRequest({
        kind: CourseChangeRequestKind.QUIZ_CREATE,
        courseId,
        targetId: null,
        payload: { ...payload } as QuizChangePayload,
        prevData: null,
        requestedBy: this.requireRequester(requester),
      });
    }

    const quiz = await this.createOne(payload);
    await this.coursesService.notifyQuizChangeDirect(
      courseId,
      CourseChangeRequestKind.QUIZ_CREATE,
      requester?.userId,
    );
    return quiz;
  }

  /**
   * Entry point từ controller cho `PATCH /quizzes/:id`. Course đã publish
   * (non-admin) → tạo change request `quiz.update`; còn lại → update trực tiếp.
   */
  async updateWithReview(
    id: number,
    payload: UpdateQuizDto,
    requester?: QuizRequester,
  ): Promise<Quiz | CourseChangeRequest> {
    const quiz = await this.findOne(id);
    const { courseId, needsChangeRequest } =
      await this.resolveQuizCourseContext(quiz.lessonActivityId, requester);

    if (needsChangeRequest) {
      const changePayload = { ...payload } as QuizChangePayload;
      return await this.coursesService.createQuizChangeRequest({
        kind: CourseChangeRequestKind.QUIZ_UPDATE,
        courseId,
        targetId: quiz.id,
        payload: changePayload,
        prevData: this.snapshotQuiz(quiz, changePayload),
        requestedBy: this.requireRequester(requester),
      });
    }

    const updated = await this.update(id, payload);
    await this.coursesService.notifyQuizChangeDirect(
      courseId,
      CourseChangeRequestKind.QUIZ_UPDATE,
      requester?.userId,
    );
    return updated;
  }

  /**
   * Entry point từ controller cho `DELETE /quizzes/:id`. Course đã publish
   * (non-admin) → tạo change request `quiz.delete`; còn lại → remove trực tiếp.
   */
  async removeWithReview(
    id: number,
    requester?: QuizRequester,
  ): Promise<void | CourseChangeRequest> {
    const quiz = await this.findOne(id);
    const { courseId, needsChangeRequest } =
      await this.resolveQuizCourseContext(quiz.lessonActivityId, requester);

    if (needsChangeRequest) {
      return await this.coursesService.createQuizChangeRequest({
        kind: CourseChangeRequestKind.QUIZ_DELETE,
        courseId,
        targetId: quiz.id,
        // payload rỗng (xoá không có state mới); prevData giữ tên quiz để admin
        // biết đang xoá quiz nào.
        payload: {},
        prevData: { name: quiz.name },
        requestedBy: this.requireRequester(requester),
      });
    }

    await this.remove(id);
    await this.coursesService.notifyQuizChangeDirect(
      courseId,
      CourseChangeRequestKind.QUIZ_DELETE,
      requester?.userId,
    );
  }

  /**
   * Replay một quiz change request đã được admin duyệt vào DB. Gọi từ
   * CoursesService.approveQuizChangeRequest. Dùng lại các primitive create/update/
   * remove (không kèm permission/published check).
   */
  async applyApprovedQuizChange(request: CourseChangeRequest): Promise<void> {
    switch (request.kind) {
      case CourseChangeRequestKind.QUIZ_CREATE:
        await this.createOne(request.payload as CreateQuizDto);
        return;
      case CourseChangeRequestKind.QUIZ_UPDATE:
        if (!request.targetId) {
          throw new BadRequestException(
            'Quiz change request is missing the target quiz id',
          );
        }
        await this.update(request.targetId, request.payload as UpdateQuizDto);
        return;
      case CourseChangeRequestKind.QUIZ_DELETE:
        if (!request.targetId) {
          throw new BadRequestException(
            'Quiz change request is missing the target quiz id',
          );
        }
        await this.remove(request.targetId);
        return;
      default:
        throw new BadRequestException(
          `Unsupported quiz change request kind: ${request.kind}`,
        );
    }
  }

  /**
   * Hard delete — xoá vĩnh viễn 1 quiz (qua paranoid `force: true`).
   * Dùng khi admin muốn dọn data sau N ngày, không phải workflow giảng viên thường.
   */
  async destroyForever(id: number): Promise<void> {
    const quiz = await this.quizModel.findByPk(id, { paranoid: false });
    if (!quiz) throw new NotFoundException(`Quiz with ID ${id} not found`);
    await quiz.destroy({ force: true });
  }

  /**
   * Soft delete 1 câu hỏi cụ thể (giảng viên không thích câu này).
   * Quiz vẫn tồn tại — chỉ ẩn câu hỏi + tất cả options của nó.
   */
  async softDeleteQuestion(quizId: number, questionId: number): Promise<void> {
    const question = await this.quizQuestionModel.findOne({
      where: { id: questionId, quizId },
    });
    if (!question) {
      throw new NotFoundException(
        `Question ${questionId} not found in quiz ${quizId}`,
      );
    }
    // Cascade soft-delete options cùng question (paranoid + onDelete: CASCADE)
    await this.sequelize.transaction(async (transaction) => {
      await this.quizOptionModel.destroy({
        where: { questionId },
        transaction,
      });
      await question.destroy({ transaction });
    });
  }

  /**
   * Bulk-filter: giảng viên đánh dấu keep `[3, 7, 11, ...]` → soft-delete
   * những câu KHÔNG nằm trong list. Reindex `order_index` 1..N theo thứ tự
   * keep (để UI hiển thị thứ tự đúng).
   *
   * Lý do thiết kế:
   *   - Nhận `keepQuestionIds` (whitelist) thay vì `deleteIds` (blacklist):
   *     idempotent, an toàn khi gọi lại; client không cần biết tổng số
   *     câu hiện có.
   *   - Validate tất cả IDs phải thuộc quiz này — chống bug truyền nhầm
   *     id quiz khác.
   *   - Reindex để FE hiển thị 1, 2, 3... liên tục thay vì 1, 5, 9, ...
   */
  async filterQuestions(
    quizId: number,
    payload: FilterQuizQuestionsDto,
  ): Promise<Quiz> {
    const quiz = await this.quizModel.findByPk(quizId, {
      include: [
        {
          model: QuizQuestion,
          as: 'questions',
          required: false,
          attributes: ['id'],
        },
      ],
    });
    if (!quiz) throw new NotFoundException(`Quiz ${quizId} not found`);

    const allIds = (quiz.questions ?? []).map((q) => q.id);
    const keepSet = new Set(payload.keepQuestionIds);
    const invalidIds = payload.keepQuestionIds.filter(
      (id) => !allIds.includes(id),
    );
    if (invalidIds.length) {
      throw new BadRequestException(
        `Question IDs không thuộc quiz ${quizId}: ${invalidIds.join(', ')}`,
      );
    }
    const deleteIds = allIds.filter((id) => !keepSet.has(id));

    await this.sequelize.transaction(async (transaction) => {
      // 1) Soft-delete options của các câu bị loại
      if (deleteIds.length) {
        await this.quizOptionModel.destroy({
          where: { questionId: { [Op.in]: deleteIds } },
          transaction,
        });
        await this.quizQuestionModel.destroy({
          where: { id: { [Op.in]: deleteIds } },
          transaction,
        });
      }

      // 2) Reindex orderIndex 1..N theo thứ tự keep client gửi
      //    (FE có thể đã drag-drop sắp xếp lại → giữ nguyên thứ tự đó)
      for (let i = 0; i < payload.keepQuestionIds.length; i++) {
        await this.quizQuestionModel.update(
          { orderIndex: i + 1 },
          { where: { id: payload.keepQuestionIds[i] }, transaction },
        );
      }
    });

    return await this.findOne(quizId);
  }

  /**
   * Restore: undo soft-delete các câu hỏi (cùng options của chúng).
   * Không tự reindex — caller chủ động gọi `filterQuestions` lại nếu cần.
   */
  async restoreQuestions(
    quizId: number,
    payload: RestoreQuizQuestionsDto,
  ): Promise<Quiz> {
    const quiz = await this.quizModel.findByPk(quizId);
    if (!quiz) throw new NotFoundException(`Quiz ${quizId} not found`);

    // Tra cả soft-deleted để verify ownership
    const questions = await this.quizQuestionModel.findAll({
      where: { id: { [Op.in]: payload.questionIds }, quizId },
      paranoid: false,
    });
    const foundIds = questions.map((q) => q.id);
    const missing = payload.questionIds.filter((id) => !foundIds.includes(id));
    if (missing.length) {
      throw new NotFoundException(
        `Question IDs không thuộc quiz ${quizId}: ${missing.join(', ')}`,
      );
    }

    await this.sequelize.transaction(async (transaction) => {
      await this.quizQuestionModel.restore({
        where: { id: { [Op.in]: payload.questionIds } },
        transaction,
      });
      await this.quizOptionModel.restore({
        where: { questionId: { [Op.in]: payload.questionIds } },
        transaction,
      });
    });

    return await this.findOne(quizId);
  }

  /**
   * Get list câu hỏi (kể cả soft-deleted) — cho UI "undo" hoặc "show history".
   * Trả về 2 nhóm để FE biết câu nào active, câu nào đã xoá.
   */
  async listAllQuestions(
    quizId: number,
  ): Promise<{ active: QuizQuestion[]; deleted: QuizQuestion[] }> {
    const quiz = await this.quizModel.findByPk(quizId);
    if (!quiz) throw new NotFoundException(`Quiz ${quizId} not found`);

    const all = await this.quizQuestionModel.findAll({
      where: { quizId },
      paranoid: false,
      include: [
        {
          model: QuizOption,
          as: 'options',
          required: false,
          paranoid: false,
        },
      ],
      order: [['orderIndex', 'ASC']],
    });
    return {
      active: all.filter((q) => !q.deletedAt),
      deleted: all.filter((q) => !!q.deletedAt),
    };
  }
}
