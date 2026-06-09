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

@Controller('quizzes')
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  private parseRequiredHeaderInt(value: string | undefined, label: string): number {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw new UnauthorizedException(`${label} is required`);
    }
    return parsed;
  }

  private parseQuizTypeFilter(value?: string): 'in_video' | 'after_video' | undefined {
    if (typeof value !== 'string' || value.trim().length === 0) {
      return undefined;
    }

    const normalized = value.trim().toLowerCase();
    if (normalized === 'in_video' || normalized === 'after_video') {
      return normalized;
    }

    throw new BadRequestException('type must be either "in_video" or "after_video".');
  }

  // Single endpoint supports both: object and array payloads.
  @Post()
  async create(@Body() body: CreateQuizDto | CreateQuizDto[]) {
    if (Array.isArray(body)) return await this.quizzesService.createMany(body);
    return await this.quizzesService.createOne(body);
  }
  @Post('ai')
  @HttpCode(202)
  async createAI(
    @Body() body: CreateQuizAIDto | CreateQuizAIDto[],
    @Headers('x-user-id') userIdHeader?: string,
    @Headers('x-user-role') roleHeader?: string,
  ) {
    const requesterUserId = this.parseRequiredHeaderInt(userIdHeader, 'x-user-id');
    const requesterRole = this.parseRequiredHeaderInt(roleHeader, 'x-user-role');

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
  async findAll(@Query('lessonActivityId') lessonActivityId?: string) {
    const parsed =
      typeof lessonActivityId === 'string' && lessonActivityId.trim().length > 0
        ? Number(lessonActivityId)
        : undefined;
    return await this.quizzesService.findAll({ lessonActivityId: parsed });
  }

  @Get('lesson/:lessonId')
  async findAllByLessonId(
    @Param('lessonId') lessonId: string,
    @Query('type') type?: string,
  ) {
    const parsedLessonId = Number(lessonId);
    const parsedType = this.parseQuizTypeFilter(type);

    return await this.quizzesService.findAllByLessonId(parsedLessonId, parsedType);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.quizzesService.findOne(Number(id));
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() payload: UpdateQuizDto) {
    return await this.quizzesService.update(Number(id), payload);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    // Soft delete (paranoid mode trên Quiz model) — set deleted_at, không xoá vĩnh viễn
    await this.quizzesService.remove(Number(id));
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
    await this.quizzesService.softDeleteQuestion(Number(id), Number(questionId));
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

