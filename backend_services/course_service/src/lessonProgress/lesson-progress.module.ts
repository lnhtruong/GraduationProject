import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { EnrollsModule } from 'src/enrolls/enrolls.module';
import { LessonProgressController } from './lesson-progress.controller';
import { LessonProgressService } from './lesson-progress.service';
import { LessonProgress } from 'src/models/lesson-progress.model';
import { Course } from 'src/models/course.model';
import { Lesson } from 'src/models/lesson.model';

@Module({
  imports: [
    SequelizeModule.forFeature([LessonProgress, Course, Lesson]),
    EnrollsModule,
  ],
  controllers: [LessonProgressController],
  providers: [LessonProgressService],
})
export class LessonProgressModule {}
