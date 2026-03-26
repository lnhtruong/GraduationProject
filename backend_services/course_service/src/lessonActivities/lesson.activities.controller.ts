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

  @Post()
  create(@Body() body: CreateLessonActivityDto) {
    console.log('check body: ', body);
    return this.lessonActivitiesService.create(body);
  }

  @Get()
  findAllByLessonId(@Query('lessonId') lessonId: string) {
    if (lessonId) {
      return this.lessonActivitiesService.findAllByLessonId(+lessonId);
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
  update(@Param('id') id: string, @Body() updateLessonActivityDto: UpdateLessonActivityDto) {
    return this.lessonActivitiesService.update(+id, updateLessonActivityDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.lessonActivitiesService.remove(+id);
  }
}