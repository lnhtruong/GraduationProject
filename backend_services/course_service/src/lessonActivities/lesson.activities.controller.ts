// src/models/lesson-activities/lesson-activities.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Headers } from '@nestjs/common';
import { LessonActivitiesService } from './lesson.activities.service';
import { CreateLessonActivityDto } from './dto/create-lesson-activities.dto';
import { UpdateLessonActivityDto } from './dto/update-lesson-activities.dto';
// import { LessonActivitiesService } from './lesson-activities.service';
// import { CreateLessonActivityDto } from './dto/create-lesson-activity.dto';
// import { UpdateLessonActivityDto } from './dto/update-lesson-activity.dto';

@Controller('lesson-activities')
export class LessonActivitiesController {
  constructor(private readonly lessonActivitiesService: LessonActivitiesService) { }

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

  @Post()
  create(
    @Body() body: CreateLessonActivityDto,
    @Headers('x-user-id') userIdHeader?: string,
    @Headers('x-user-role') roleHeader?: string,
  ) {
    return this.lessonActivitiesService.create(
      body,
      this.parseRequester(userIdHeader, roleHeader),
    );
  }

  @Get()
  findAllByLessonId(
    @Query('lessonId') lessonId: string,
    @Query('status') status?: string,
  ) {
    if (lessonId) {
      return this.lessonActivitiesService.findAllByLessonId(+lessonId, status);
    }
    return [];
  }

  @Get('user')
  findAllByUserId(@Headers('x-user-id') userIdHeader?: string) {
    const user_id =
      typeof userIdHeader === 'string' && userIdHeader.trim().length > 0
        ? Number(userIdHeader)
        : undefined;
    if (user_id) {
      return this.lessonActivitiesService.findAllByUserId(user_id);
    }
    return [];
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.lessonActivitiesService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateLessonActivityDto: UpdateLessonActivityDto,
    @Headers('x-user-id') userIdHeader?: string,
    @Headers('x-user-role') roleHeader?: string,
  ) {
    return this.lessonActivitiesService.update(
      +id,
      updateLessonActivityDto,
      this.parseRequester(userIdHeader, roleHeader),
    );
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Headers('x-user-id') userIdHeader?: string,
    @Headers('x-user-role') roleHeader?: string,
  ) {
    return this.lessonActivitiesService.remove(
      +id,
      this.parseRequester(userIdHeader, roleHeader),
    );
  }
}