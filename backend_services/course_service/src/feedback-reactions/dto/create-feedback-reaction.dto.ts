import { IsEnum, IsInt } from 'class-validator';
import { FeedbackReactionType } from 'src/models/feedback-reaction.model';

export class CreateFeedbackReactionDto {
  @IsInt()
  feedbackId: number;

  @IsEnum(FeedbackReactionType)
  reactionType: FeedbackReactionType;
}
