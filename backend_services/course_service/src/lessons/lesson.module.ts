// src/models/lessons/lessons.module.ts
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { LessonsService } from './lesson.service';
import { LessonsController } from './lesson.controller';
import { Lesson } from 'src/models/lesson.model';
import { Video } from 'src/models/video.model';
import { CoursesModule } from 'src/course/course.module';

@Module({
  imports: [SequelizeModule.forFeature([Lesson, Video]), CoursesModule],
  controllers: [LessonsController],
  providers: [LessonsService],
  exports: [LessonsService],
})
export class LessonsModule {}