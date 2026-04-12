import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Headers
} from '@nestjs/common';
import { LessonProgressService } from './lesson-progress.service';
import { CreateLessonProgressDto } from './dto/create-lesson-progress.dto';
import { UpdateLessonProgressDto } from './dto/update-lesson-progress.dto';
import { GetLessonProgressQueryDto } from './dto/get-lesson-progress-query.dto';

@Controller('lesson-progress')
export class LessonProgressController {
  constructor(private readonly lessonProgressService: LessonProgressService) { }

  @Post()
  create(@Body() dto: CreateLessonProgressDto, @Headers('x-user-id') userIdHeader?: string) {
    const user_id =
      typeof userIdHeader === 'string' && userIdHeader.trim().length > 0
        ? Number(userIdHeader)
        : undefined;

    return this.lessonProgressService.create(dto, user_id);
  }

  @Get()
  findAll(@Query() query: GetLessonProgressQueryDto, @Headers('x-user-id') userIdHeader?: string) {
    const user_id =
      typeof userIdHeader === 'string' && userIdHeader.trim().length > 0
        ? Number(userIdHeader)
        : undefined;
    return this.lessonProgressService.findAll(query, user_id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.lessonProgressService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateLessonProgressDto,
  ) {
    return this.lessonProgressService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.lessonProgressService.remove(id);
  }
}
