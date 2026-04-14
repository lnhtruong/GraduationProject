import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Course } from 'src/models/course.model';
import { Feedback } from 'src/models/feedback.model';
import { FeedbacksController } from './feedbacks.controller';
import { FeedbacksService } from './feedbacks.service';
import { FeedbackReaction } from 'src/models/feedback-reaction.model';

@Module({
  imports: [SequelizeModule.forFeature([Feedback, Course, FeedbackReaction])],
  controllers: [FeedbacksController],
  providers: [FeedbacksService],
  exports: [FeedbacksService],
})
export class FeedbacksModule { }
