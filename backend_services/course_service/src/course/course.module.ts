import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { CategoriesController } from './categories.controller';
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
import { User } from 'src/users/user.model';
import { InstructorFollow } from 'src/models/instructor-follow.model';

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
      User,
      InstructorFollow,
    ]),
  ],
  controllers: [CoursesController, CategoriesController],
  providers: [CoursesService],
  exports: [CoursesService],
})
export class CoursesModule {}
