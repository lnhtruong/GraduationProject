import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Quiz } from 'src/models/quiz.model';
import { QuizQuestion } from 'src/models/quiz-question.model';
import { QuizOption } from 'src/models/quiz-option.model';
import { Video } from 'src/models/video.model';
import { LessonActivity } from 'src/models/lesson-activity.model';
import { QuizzesController } from './quizzes.controller';
import { QuizzesService } from './quizzes.service';

@Module({
  imports: [SequelizeModule.forFeature([Quiz, QuizQuestion, QuizOption, Video, LessonActivity])],
  controllers: [QuizzesController],
  providers: [QuizzesService],
  exports: [QuizzesService],
})
export class QuizzesModule {}

