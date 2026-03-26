// src/models/lesson-activities/lesson-activities.module.ts
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { LessonActivitiesController } from './lesson.activities.controller';
import { LessonActivitiesService } from './lesson.activities.service';
import { LessonActivity } from 'src/models/lesson-activity.model';
// import { LessonActivitiesService } from './lesson-activities.service';
// import { LessonActivitiesController } from './lesson-activities.controller';
// import { LessonActivity } from './models/lesson-activity.model';

@Module({
  imports: [SequelizeModule.forFeature([LessonActivity])],
  controllers: [LessonActivitiesController],
  providers: [LessonActivitiesService],
  exports: [LessonActivitiesService],
})
export class LessonActivitiesModule {}