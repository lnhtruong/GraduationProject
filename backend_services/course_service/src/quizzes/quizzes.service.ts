import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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
import { generateQuizPayload } from './helper/index.quiz_gen';
import { toPersistableQuestionRow } from './quiz-payload.mapper';
import { resolveSrtRawForQuiz } from './resolve-srt';

const VIDEO_TIMESTAMP_REGEX = /^\d{2}:\d{2}:\d{2}[,.]\d{3}$/;

@Injectable()
export class QuizzesService {
  constructor(
    @InjectModel(Quiz) private readonly quizModel: typeof Quiz,
    @InjectModel(QuizQuestion) private readonly quizQuestionModel: typeof QuizQuestion,
    @InjectModel(QuizOption) private readonly quizOptionModel: typeof QuizOption,
    @InjectModel(Video) private readonly videoModel: typeof Video,
    @InjectModel(LessonActivity) private readonly lessonActivityModel: typeof LessonActivity,
    @InjectConnection() private readonly sequelize: Sequelize,
  ) { }

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

  async createOneByAI(payload: CreateQuizAIDto): Promise<Quiz> {
    const isInVideo = payload.isInVideo ?? false;
    const video = await this.videoModel.findByPk(payload.videoId, {
      attributes: ['id', 'srt_raw_url'],
    });
    if (!video) {
      throw new NotFoundException(`Video with ID ${payload.videoId} not found`);
    }
    const srtRawStored = video.srt_raw_url?.trim();
    if (!srtRawStored) {
      throw new BadRequestException(
        'Video has no srt_raw_url. Upload the SRT to Cloudinary (raw) and wait for the webhook, or set srt_raw_url via API.',
      );
    }

    let srtText: string;
    try {
      srtText = await resolveSrtRawForQuiz(srtRawStored);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new BadRequestException(`Could not load SRT content: ${msg}`);
    }

    const generated = await generateQuizPayload(
      srtText,
      payload.name,
      payload.shuffleQuestion ?? false,
      payload.shuffleOption ?? false,
      payload.passingScore ?? 0,
      payload.timeLimitMinutes ?? 0,
    );

    const generatedRows = generated.questions.map((q) => {
      const row = toPersistableQuestionRow(q);
      return {
        ...row,
        videoTimestamp: this.normalizeVideoTimestamp(row.videoTimestamp),
      };
    });
    this.assertQuizVideoTimestampConsistency(isInVideo, generatedRows);

    // console.log('check generated: ', generated);

    return await this.sequelize.transaction(async (transaction) => {
      const quiz = await this.quizModel.create(
        {
          lessonActivityId: payload.lessonActivityId,
          name: generated.name,
          shuffleQuestion: generated.shuffleQuestion,
          shuffleOption: generated.shuffleOption,
          passingScore: generated.passingScore,
          timeLimitMinutes: generated.timeLimitMinutes,
          isInVideo: isInVideo,
        },
        { transaction },
      );

      for (const row of generatedRows) {
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
          // console.log('check options: ', row.options);
          await this.quizOptionModel.bulkCreate(
            row.options.map((o) => ({
              questionId: question.id,
              optionText: o.optionText,
              isCorrect: o.isCorrect ?? false,
              orderIndex: o.orderIndex,
            })),
            { transaction },
          );
        }
      }

      return await this.findOne(quiz.id, { transaction });
    });
  }

  async createManyByAI(payloads: CreateQuizAIDto[]): Promise<Quiz[]> {
    const out: Quiz[] = [];
    for (const p of payloads) {
      out.push(await this.createOneByAI(p));
    }
    return out;
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

  private async createOneWithTransaction(payload: CreateQuizDto, transaction: any): Promise<Quiz> {
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
    if (filter?.lessonActivityId) where.lessonActivityId = filter.lessonActivityId;

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
      order: [[{ model: QuizQuestion, as: 'questions' }, 'orderIndex', 'ASC']]
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

      const consistencySource = normalizedPayloadQuestions ?? quiz.questions ?? [];
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
        await this.quizQuestionModel.destroy({ where: { quizId: id }, transaction });

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
    const quiz = await this.quizModel.findByPk(id);
    if (!quiz) throw new NotFoundException(`Quiz with ID ${id} not found`);
    await quiz.destroy();
  }
}

