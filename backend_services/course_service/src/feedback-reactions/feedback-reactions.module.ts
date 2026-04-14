import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { FeedbackReaction } from 'src/models/feedback-reaction.model';
import { Feedback } from 'src/models/feedback.model';
import { FeedbackReactionsController } from './feedback-reactions.controller';
import { FeedbackReactionsService } from './feedback-reactions.service';

@Module({
  imports: [SequelizeModule.forFeature([FeedbackReaction, Feedback])],
  controllers: [FeedbackReactionsController],
  providers: [FeedbackReactionsService],
  exports: [FeedbackReactionsService],
})
export class FeedbackReactionsModule {}
