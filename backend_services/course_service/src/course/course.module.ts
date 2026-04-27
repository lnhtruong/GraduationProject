import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { CoursesController } from './course.controller';
import { CoursesService } from './course.service';
import { Course } from 'src/models/course.model';
import { Lesson } from 'src/models/lesson.model';
import { Enroll } from 'src/models/enroll.model';
import { Feedback } from 'src/models/feedback.model';

@Module({
  imports: [SequelizeModule.forFeature([Course, Lesson, Enroll, Feedback])],
  controllers: [CoursesController],
  providers: [CoursesService],
  exports: [CoursesService],
})
export class CoursesModule {}
