// src/models/lessons/lessons.module.ts
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { LessonsService } from './lesson.service';
import { LessonsController } from './lesson.controller';
import { Lesson } from 'src/models/lesson.model';
import { CoursesModule } from 'src/course/course.module';
// import { Lesson } from './models/lesson.model';

@Module({
  imports: [SequelizeModule.forFeature([Lesson]),
  CoursesModule,],
  controllers: [LessonsController],
  providers: [LessonsService],
  exports: [LessonsService],
})
export class LessonsModule {}