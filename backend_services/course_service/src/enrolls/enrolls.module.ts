import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { EnrollsController } from './enrolls.controller';
import { EnrollsService } from './enrolls.service';
import { Enroll } from 'src/models/enroll.model';
import { LessonProgress } from 'src/models/lesson-progress.model';
import { Course } from 'src/models/course.model';
import { Lesson } from 'src/models/lesson.model';

@Module({
  imports: [
    SequelizeModule.forFeature([Enroll, LessonProgress, Course, Lesson]),
  ],
  controllers: [EnrollsController],
  providers: [EnrollsService],
  exports: [EnrollsService],
})
export class EnrollsModule {}
