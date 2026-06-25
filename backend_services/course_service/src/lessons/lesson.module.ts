// src/models/lessons/lessons.module.ts
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { LessonsService } from './lesson.service';
import { LessonsController } from './lesson.controller';
import { Lesson } from 'src/models/lesson.model';
import { Video } from 'src/models/video.model';
import { CoursesModule } from 'src/course/course.module';
import { EnrollsModule } from 'src/enrolls/enrolls.module';

@Module({
  imports: [
    SequelizeModule.forFeature([Lesson, Video]),
    CoursesModule,
    EnrollsModule,
  ],
  controllers: [LessonsController],
  providers: [LessonsService],
  exports: [LessonsService],
})
export class LessonsModule {}
