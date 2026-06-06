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
import {
  CreateQuizFromAIDto,
  QuizQuestionFromAIDto,
} from './dto/create-quiz-from-ai.dto';
import { FilterQuizQuestionsDto } from './dto/filter-quiz-questions.dto';
import { RestoreQuizQuestionsDto } from './dto/restore-quiz-questions.dto';
import { generateQuizPayload } from './helper/index.quiz_gen';
import { toPersistableQuestionRow } from './quiz-payload.mapper';
import { resolveSrtRawForQuiz } from './resolve-srt';
import { QuestionType } from 'src/models/quiz-question.model';

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
    const isInVideo = payload.isInVideo ?? true; // Colab evidence có timestamp → default in_video

    const video = await this.videoModel.findByPk(payload.videoId, {
      attributes: ['id'],
    });
    if (!video) {
      throw new NotFoundException(`Video ${payload.videoId} not found`);
    }

    const lessonActivity = await this.lessonActivityModel.findByPk(
      payload.lessonActivityId,
      { attributes: ['id'] },
    );
    if (!lessonActivity) {
      throw new NotFoundException(
        `LessonActivity ${payload.lessonActivityId} not found`,
      );
    }

    const rows = payload.questions.map((q, idx) => this.toRowFromAI(q, idx + 1));
    this.assertQuizVideoTimestampConsistency(isInVideo, rows);

    return await this.sequelize.transaction(async (transaction) => {
      const quiz = await this.quizModel.create(
        {
          lessonActivityId: payload.lessonActivityId,
          name: payload.name,
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

  /**
   * Convert 1 câu hỏi shape Colab (`{question, options:{a,b,c,d}, correct, evidence}`)
   * sang shape DB (`quesText, correctAns, options[].isCorrect`).
   */
  private toRowFromAI(q: QuizQuestionFromAIDto, orderIndex: number) {
    const optMap = q.options ?? {};
    const orderedKeys: Array<'a' | 'b' | 'c' | 'd'> = ['a', 'b', 'c', 'd'];
    const options = orderedKeys
      .filter((k) => typeof optMap[k] === 'string')
      .map((k, i) => ({
        optionText: String(optMap[k]),
        isCorrect: k === q.correct,
        orderIndex: i + 1,
      }));

    const videoTimestamp = q.evidence
      ? this.msToTimestamp(q.evidence.start_ms)
      : null;

    return {
      quesType: QuestionType.MULTIPLE_CHOICE,
      quesText: q.question,
      point: 1,
      correctAns: q.explanation ?? null,
      orderIndex,
      videoTimestamp,
      options,
    };
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
    // Vì models đã `paranoid: true` → .destroy() là SOFT DELETE
    // (set `deleted_at` = NOW, không xoá vĩnh viễn).
    const quiz = await this.quizModel.findByPk(id);
    if (!quiz) throw new NotFoundException(`Quiz with ID ${id} not found`);
    await quiz.destroy();
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
    const invalidIds = payload.keepQuestionIds.filter((id) => !allIds.includes(id));
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

