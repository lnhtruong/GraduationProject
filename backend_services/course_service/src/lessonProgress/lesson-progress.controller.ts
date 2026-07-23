import {
  Body,
  Controller,
  DefaultValuePipe,
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
import { HeartbeatLessonProgressDto } from './dto/heartbeat-lesson-progress.dto';

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

  @Get('continue-watching')
  continueWatching(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Headers('x-user-id') userIdHeader?: string,
  ) {
    const user_id =
      typeof userIdHeader === 'string' && userIdHeader.trim().length > 0
        ? Number(userIdHeader)
        : undefined;
    return this.lessonProgressService.continueWatching(user_id, limit);
  }

  @Patch(':id/heartbeat')
  heartbeat(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: HeartbeatLessonProgressDto,
    @Headers('x-user-id') userIdHeader?: string,
  ) {
    const user_id =
      typeof userIdHeader === 'string' && userIdHeader.trim().length > 0
        ? Number(userIdHeader)
        : undefined;
    return this.lessonProgressService.heartbeat(id, dto.position, user_id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.lessonProgressService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateLessonProgressDto,
    @Headers('x-user-id') userIdHeader?: string,
  ) {
    const user_id =
      typeof userIdHeader === 'string' && userIdHeader.trim().length > 0
        ? Number(userIdHeader)
        : undefined;

    return this.lessonProgressService.update(id, dto, user_id);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.lessonProgressService.remove(id);
  }
}
