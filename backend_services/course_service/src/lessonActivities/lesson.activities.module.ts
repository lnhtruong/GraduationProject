// src/models/lesson-activities/lesson-activities.module.ts
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { LessonActivitiesController } from './lesson.activities.controller';
import { LessonActivitiesService } from './lesson.activities.service';
import { LessonActivity } from 'src/models/lesson-activity.model';
import { Lesson } from 'src/models/lesson.model';
import { CoursesModule } from 'src/course/course.module';
// import { LessonActivitiesService } from './lesson-activities.service';
// import { LessonActivitiesController } from './lesson-activities.controller';
// import { LessonActivity } from './models/lesson-activity.model';

@Module({
  imports: [SequelizeModule.forFeature([LessonActivity, Lesson]), CoursesModule],
  controllers: [LessonActivitiesController],
  providers: [LessonActivitiesService],
  exports: [LessonActivitiesService],
})
export class LessonActivitiesModule {}