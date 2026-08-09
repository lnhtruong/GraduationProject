import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { QuizzesService } from './quizzes.service';
import { CreateQuizAIDto } from './dto/create-quiz-ai.dto';
import { CreateQuizFromAIDto } from './dto/create-quiz-from-ai.dto';
import { FilterQuizQuestionsDto } from './dto/filter-quiz-questions.dto';
import { RestoreQuizQuestionsDto } from './dto/restore-quiz-questions.dto';
import { Quiz } from 'src/models/quiz.model';
import { CourseChangeRequest } from 'src/models/course-change-request.model';

@Controller('quizzes')
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  private parseRequiredHeaderInt(
    value: string | undefined,
    label: string,
  ): number {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw new UnauthorizedException(`${label} is required`);
    }
    return parsed;
  }

  /** Parse requester từ header (optional) — dùng cho gating change request. */
  private parseRequester(
    userIdHeader?: string,
    roleHeader?: string,
  ): { userId?: number; role?: number } {
    let userId: number | undefined;
    if (typeof userIdHeader === 'string' && userIdHeader.trim().length > 0) {
      const parsed = Number(userIdHeader);
      if (Number.isInteger(parsed) && parsed > 0) userId = parsed;
    }
    let role: number | undefined;
    if (typeof roleHeader === 'string' && roleHeader.trim().length > 0) {
      const parsed = Number(roleHeader);
      if (Number.isInteger(parsed)) role = parsed;
    }
    return { userId, role };
  }

  private stripAnswers(quiz: any) {
    if (!quiz) return quiz;
    const plainQuiz = typeof quiz.get === 'function' ? quiz.get({ plain: true }) : quiz;
    if (plainQuiz.questions) {
      for (const question of plainQuiz.questions) {
        delete question.correctAns;
        delete question.explanation;
        if (question.options) {
          for (const option of question.options) {
            delete option.isCorrect;
          }
        }
      }
    }
    return plainQuiz;
  }

  private parseQuizTypeFilter(
    value?: string,
  ): 'in_video' | 'after_video' | undefined {
    if (typeof value !== 'string' || value.trim().length === 0) {
      return undefined;
    }

    const normalized = value.trim().toLowerCase();
    if (normalized === 'in_video' || normalized === 'after_video') {
      return normalized;
    }

    throw new BadRequestException(
      'type must be either "in_video" or "after_video".',
    );
  }

  // Single endpoint supports both: object and array payloads.
  @Post()
  async create(
    @Body() body: CreateQuizDto | CreateQuizDto[],
    @Headers('x-user-id') userIdHeader?: string,
    @Headers('x-user-role') roleHeader?: string,
  ) {
    const requester = this.parseRequester(userIdHeader, roleHeader);
    // Course đã publish (non-admin) → mỗi quiz đi qua change request; còn lại
    // tạo trực tiếp. Xử lý từng item để cùng một code path gating.
    if (Array.isArray(body)) {
      const out: Array<Quiz | CourseChangeRequest> = [];
      for (const item of body) {
        out.push(
          await this.quizzesService.createOneWithReview(item, requester),
        );
      }
      return out;
    }
    return await this.quizzesService.createOneWithReview(body, requester);
  }
  @Post('ai')
  @HttpCode(202)
  async createAI(
    @Body() body: CreateQuizAIDto | CreateQuizAIDto[],
    @Headers('x-user-id') userIdHeader?: string,
    @Headers('x-user-role') roleHeader?: string,
  ) {
    const requesterUserId = this.parseRequiredHeaderInt(
      userIdHeader,
      'x-user-id',
    );
    const requesterRole = this.parseRequiredHeaderInt(
      roleHeader,
      'x-user-role',
    );

    if (Array.isArray(body)) {
      return await this.quizzesService.createManyByAI(body, {
        requesterUserId,
        requesterRole,
      });
    }
    return await this.quizzesService.createOneByAI(body, {
      requesterUserId,
      requesterRole,
    });
  }

  /**
   * Endpoint async — nhận quiz đã pre-generated từ Colab (qua media_service webhook).
   * Skip OpenAI inline gen, chỉ map shape Colab → DB và insert.
   *
   * Phân biệt với `/quizzes/ai`:
   *   - `/quizzes/ai`     : block 30s+ vì gen OpenAI inline; truyền `videoId` để đọc srt_raw_url
   *   - `/quizzes/from-ai`: instant insert; truyền `questions[]` đã sinh sẵn
   */
  @Post('from-ai')
  async createFromAI(@Body() body: CreateQuizFromAIDto) {
    return await this.quizzesService.createFromAI(body);
  }

  @Get()
  async findAll(
    @Query('lessonActivityId') lessonActivityId?: string,
    @Headers('x-user-id') userIdHeader?: string,
    @Headers('x-user-role') roleHeader?: string,
  ) {
    const parsed =
      typeof lessonActivityId === 'string' && lessonActivityId.trim().length > 0
        ? Number(lessonActivityId)
        : undefined;
    const requester = this.parseRequester(userIdHeader, roleHeader);
    const quizzes = await this.quizzesService.findAll({ lessonActivityId: parsed });

    const hasBypassPrivilege = parsed
      ? await this.quizzesService.isQuizOwnerOrAdmin(requester, { lessonActivityId: parsed })
      : requester.role === 1;

    if (!hasBypassPrivilege) {
      return quizzes.map((q) => this.stripAnswers(q));
    }
    return quizzes;
  }

  @Get('lesson/:lessonId/timeline')
  async findTimelineByLessonId(
    @Param('lessonId') lessonId: string,
    @Query('status') status?: string,
    @Headers('x-user-id') userIdHeader?: string,
    @Headers('x-user-role') roleHeader?: string,
  ) {
    const parsedLessonId = Number(lessonId);
    const requester = this.parseRequester(userIdHeader, roleHeader);

    await this.quizzesService.isQuizOwnerOrAdmin(requester, {
      lessonId: parsedLessonId,
    });

    return this.quizzesService.findTimelineByLessonId(
      parsedLessonId,
      status,
    );
  }

  @Get('lesson/:lessonId')
  async findAllByLessonId(
    @Param('lessonId') lessonId: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Headers('x-user-id') userIdHeader?: string,
    @Headers('x-user-role') roleHeader?: string,
  ) {
    const parsedLessonId = Number(lessonId);
    const parsedType = this.parseQuizTypeFilter(type);
    const requester = this.parseRequester(userIdHeader, roleHeader);

    const quizzes = await this.quizzesService.findAllByLessonId(
      parsedLessonId,
      parsedType,
      status,
    );

    const hasBypassPrivilege = await this.quizzesService.isQuizOwnerOrAdmin(
      requester,
      { lessonId: parsedLessonId },
    );

    if (!hasBypassPrivilege) {
      return quizzes.map((q) => this.stripAnswers(q));
    }
    return quizzes;
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Headers('x-user-id') userIdHeader?: string,
    @Headers('x-user-role') roleHeader?: string,
  ) {
    const requester = this.parseRequester(userIdHeader, roleHeader);
    const quiz = await this.quizzesService.findOne(Number(id));

    const hasBypassPrivilege = await this.quizzesService.isQuizOwnerOrAdmin(
      requester,
      { quizId: Number(id) },
    );

    if (!hasBypassPrivilege) {
      return this.stripAnswers(quiz);
    }
    return quiz;
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() payload: UpdateQuizDto,
    @Headers('x-user-id') userIdHeader?: string,
    @Headers('x-user-role') roleHeader?: string,
  ) {
    const requester = this.parseRequester(userIdHeader, roleHeader);
    return await this.quizzesService.updateWithReview(
      Number(id),
      payload,
      requester,
    );
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Headers('x-user-id') userIdHeader?: string,
    @Headers('x-user-role') roleHeader?: string,
  ) {
    // Soft delete (paranoid mode trên Quiz model) — set deleted_at, không xoá vĩnh viễn.
    // Xoá trực tiếp (không còn change request); chỉ admin/chủ khóa được xoá.
    const requester = this.parseRequester(userIdHeader, roleHeader);
    await this.quizzesService.removeWithReview(Number(id), requester);
    return { success: true };
  }

  /**
   * Bulk-filter câu hỏi: giảng viên gửi `keepQuestionIds` → backend soft-delete
   * những câu còn lại + reindex orderIndex theo thứ tự keep.
   *
   * Use case chính: sau khi AI sinh 30 câu, giảng viên chọn 15 câu ưng nhất.
   */
  @Patch(':id/filter-questions')
  async filterQuestions(
    @Param('id') id: string,
    @Body() body: FilterQuizQuestionsDto,
  ) {
    return await this.quizzesService.filterQuestions(Number(id), body);
  }

  /** Soft-delete 1 câu hỏi cụ thể (không xoá toàn bộ quiz). */
  @Delete(':id/questions/:questionId')
  async removeQuestion(
    @Param('id') id: string,
    @Param('questionId') questionId: string,
  ) {
    await this.quizzesService.softDeleteQuestion(
      Number(id),
      Number(questionId),
    );
    return { success: true };
  }

  /** Khôi phục câu hỏi đã bị soft-delete (undo). */
  @Post(':id/restore-questions')
  async restoreQuestions(
    @Param('id') id: string,
    @Body() body: RestoreQuizQuestionsDto,
  ) {
    return await this.quizzesService.restoreQuestions(Number(id), body);
  }

  /**
   * Show toàn bộ câu hỏi của quiz (cả active lẫn soft-deleted).
   * Trả `{active: [...], deleted: [...]}` cho FE hiển thị "Đã xoá (5)" để undo.
   */
  @Get(':id/questions/all')
  async listAllQuestions(@Param('id') id: string) {
    return await this.quizzesService.listAllQuestions(Number(id));
  }
}
