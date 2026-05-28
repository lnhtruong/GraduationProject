import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { CoursesController } from './course.controller';
import { CoursesService } from './course.service';
import { Course } from 'src/models/course.model';
import { Lesson } from 'src/models/lesson.model';
import { LessonActivity } from 'src/models/lesson-activity.model';
import { Quiz } from 'src/models/quiz.model';
import { QuizQuestion } from 'src/models/quiz-question.model';
import { QuizOption } from 'src/models/quiz-option.model';
import { Enroll } from 'src/models/enroll.model';
import { Feedback } from 'src/models/feedback.model';
import { Video } from 'src/models/video.model';
import { InstructorFollow } from 'src/models/instructor-follow.model';
import { Notification } from 'src/models/notification.model';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Course,
      Video,
      Lesson,
      LessonActivity,
      Quiz,
      QuizQuestion,
      QuizOption,
      Enroll,
      Feedback,
      InstructorFollow,
      Notification,
    ]),
  ],
  controllers: [CoursesController],
  providers: [CoursesService],
  exports: [CoursesService],
})
export class CoursesModule {}
