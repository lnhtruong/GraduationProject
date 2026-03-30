import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Quiz } from 'src/models/quiz.model';
import { QuizQuestion } from 'src/models/quiz-question.model';
import { QuizOption } from 'src/models/quiz-option.model';
import { Video } from 'src/models/video.model';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { CreateQuizAIDto } from './dto/create-quiz-ai.dto';
import { generateQuizPayload } from './helper/index.quiz_gen';
import { toPersistableQuestionRow } from './quiz-payload.mapper';
import { resolveSrtRawForQuiz } from './resolve-srt';

@Injectable()
export class QuizzesService {
  constructor(
    @InjectModel(Quiz) private readonly quizModel: typeof Quiz,
    @InjectModel(QuizQuestion) private readonly quizQuestionModel: typeof QuizQuestion,
    @InjectModel(QuizOption) private readonly quizOptionModel: typeof QuizOption,
    @InjectModel(Video) private readonly videoModel: typeof Video,
    @InjectConnection() private readonly sequelize: Sequelize,
  ) { }

  async createOne(payload: CreateQuizDto): Promise<Quiz> {
    return await this.sequelize.transaction(async (transaction) => {
      const quiz = await this.quizModel.create(
        {
          lessonActivityId: payload.lessonActivityId,
          name: payload.name,
          shuffleQuestion: payload.shuffleQuestion ?? false,
          shuffleOption: payload.shuffleOption ?? false,
          passingScore: payload.passingScore,
          timeLimitMinutes: payload.timeLimitMinutes,
        },
        { transaction },
      );

      if (payload.questions?.length) {
        for (const q of payload.questions) {
          const question = await this.quizQuestionModel.create(
            {
              quizId: quiz.id,
              quesType: q.quesType,
              quesText: q.quesText,
              point: q.point,
              correctAns: q.correctAns,
              orderIndex: q.orderIndex,
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
        },
        { transaction },
      );

      for (const q of generated.questions) {
        const row = toPersistableQuestionRow(q);
        const question = await this.quizQuestionModel.create(
          {
            quizId: quiz.id,
            quesType: row.quesType,
            quesText: row.quesText,
            point: row.point,
            correctAns: row.correctAns,
            orderIndex: row.orderIndex,
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
    const quiz = await this.quizModel.create(
      {
        lessonActivityId: payload.lessonActivityId,
        name: payload.name,
        shuffleQuestion: payload.shuffleQuestion ?? false,
        shuffleOption: payload.shuffleOption ?? false,
        passingScore: payload.passingScore,
        timeLimitMinutes: payload.timeLimitMinutes,
      },
      { transaction },
    );

    if (payload.questions?.length) {
      for (const q of payload.questions) {
        const question = await this.quizQuestionModel.create(
          {
            quizId: quiz.id,
            quesType: q.quesType,
            quesText: q.quesText,
            point: q.point,
            correctAns: q.correctAns,
            orderIndex: q.orderIndex,
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
      const quiz = await this.quizModel.findByPk(id, { transaction });
      if (!quiz) throw new NotFoundException(`Quiz with ID ${id} not found`);

      await quiz.update(
        {
          lessonActivityId: payload.lessonActivityId ?? quiz.lessonActivityId,
          name: payload.name ?? quiz.name,
          shuffleQuestion: payload.shuffleQuestion ?? quiz.shuffleQuestion,
          shuffleOption: payload.shuffleOption ?? quiz.shuffleOption,
          passingScore: payload.passingScore ?? quiz.passingScore,
          timeLimitMinutes: payload.timeLimitMinutes ?? quiz.timeLimitMinutes,
        },
        { transaction },
      );

      // If client sends questions, treat as "replace" (simple + predictable for maintainability).
      if (payload.questions) {
        await this.quizQuestionModel.destroy({ where: { quizId: id }, transaction });

        for (const q of payload.questions) {
          const question = await this.quizQuestionModel.create(
            {
              quizId: id,
              quesType: q.quesType,
              quesText: q.quesText,
              point: q.point,
              correctAns: q.correctAns,
              orderIndex: q.orderIndex,
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

