import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Course } from 'src/models/course.model';
import { Enroll } from 'src/models/enroll.model';
import { LessonActivity } from 'src/models/lesson-activity.model';
import { Lesson } from 'src/models/lesson.model';
import { Quiz } from 'src/models/quiz.model';
import { QuizSubmission } from 'src/models/quiz-submission.model';
import { QuizzesModule } from 'src/quizzes/quizzes.module';
import { QuizSubmissionsController } from './quiz-submissions.controller';
import { QuizSubmissionsService } from './quiz-submissions.service';

@Module({
  imports: [
    SequelizeModule.forFeature([
      QuizSubmission,
      Quiz,
      LessonActivity,
      Lesson,
      Course,
      Enroll,
    ]),
    QuizzesModule,
  ],
  controllers: [QuizSubmissionsController],
  providers: [QuizSubmissionsService],
  exports: [QuizSubmissionsService],
})
export class QuizSubmissionsModule {}
