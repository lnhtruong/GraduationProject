import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Quiz } from 'src/models/quiz.model';
import { QuizQuestion } from 'src/models/quiz-question.model';
import { QuizOption } from 'src/models/quiz-option.model';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { CreateQuizAIDto } from './dto/create-quiz-ai.dto';

@Injectable()
export class QuizzesService {
  constructor(
    @InjectModel(Quiz) private readonly quizModel: typeof Quiz,
    @InjectModel(QuizQuestion) private readonly quizQuestionModel: typeof QuizQuestion,
    @InjectModel(QuizOption) private readonly quizOptionModel: typeof QuizOption,
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

  async createManyByAI(payload: CreateQuizAIDto[]): Promise<Quiz[]> {
    //srt from db
    //config
    // const payload = generateQuizPayload()
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

