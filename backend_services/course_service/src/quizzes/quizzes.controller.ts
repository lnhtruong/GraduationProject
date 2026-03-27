import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { QuizzesService } from './quizzes.service';
import { CreateQuizAIDto } from './dto/create-quiz-ai.dto';

@Controller('quizzes')
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  // Single endpoint supports both: object and array payloads.
  @Post()
  async create(@Body() body: CreateQuizDto | CreateQuizDto[]) {
    if (Array.isArray(body)) return await this.quizzesService.createMany(body);
    return await this.quizzesService.createOne(body);
  }
  @Post('ai')
  async createAI(@Body() body: CreateQuizAIDto | CreateQuizAIDto[]) {
    if (Array.isArray(body)) return await this.quizzesService.createMany(body);
    return await this.quizzesService.createOne(body);
  }

  @Get()
  async findAll(@Query('lessonActivityId') lessonActivityId?: string) {
    const parsed =
      typeof lessonActivityId === 'string' && lessonActivityId.trim().length > 0
        ? Number(lessonActivityId)
        : undefined;
    return await this.quizzesService.findAll({ lessonActivityId: parsed });
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

