import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { QuizzesService } from './quizzes.service';
import { CreateQuizAIDto } from './dto/create-quiz-ai.dto';

@Controller('quizzes')
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

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
  async createAI(@Body() body: CreateQuizAIDto | CreateQuizAIDto[]) {
    if (Array.isArray(body)) return await this.quizzesService.createManyByAI(body);
    return await this.quizzesService.createOneByAI(body);
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
    await this.quizzesService.remove(Number(id));
    return { success: true };
  }
}

