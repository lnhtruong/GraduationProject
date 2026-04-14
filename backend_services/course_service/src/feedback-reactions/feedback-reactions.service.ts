import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { FeedbackReaction, FeedbackReactionType } from 'src/models/feedback-reaction.model';
import { Feedback } from 'src/models/feedback.model';
import { CreateFeedbackReactionDto } from './dto/create-feedback-reaction.dto';

@Injectable()
export class FeedbackReactionsService {
  constructor(
    @InjectModel(FeedbackReaction)
    private readonly reactionModel: typeof FeedbackReaction,
    @InjectModel(Feedback)
    private readonly feedbackModel: typeof Feedback,
  ) {}

  async createOrUpdate(userId: number, payload: CreateFeedbackReactionDto): Promise<FeedbackReaction> {
    const feedback = await this.feedbackModel.findByPk(payload.feedbackId);
    if (!feedback || !feedback.isVisible) {
      throw new NotFoundException(`Feedback with ID ${payload.feedbackId} not found`);
    }

    const existing = await this.reactionModel.findOne({
      where: { feedbackId: payload.feedbackId, userId },
    });
    if (existing) {
      if (existing.reactionType !== payload.reactionType) {
        await existing.update({ reactionType: payload.reactionType });
      }
      return existing;
    }

    return await this.reactionModel.create({
      feedbackId: payload.feedbackId,
      userId,
      reactionType: payload.reactionType,
    });
  }

  async removeByUser(userId: number, feedbackId: number): Promise<void> {
    const deletedCount = await this.reactionModel.destroy({
      where: { feedbackId, userId },
    });
    if (!deletedCount) {
      throw new NotFoundException('Reaction not found');
    }
  }

  async getSummary(feedbackId: number, currentUserId?: number) {
    const feedback = await this.feedbackModel.findByPk(feedbackId);
    if (!feedback) {
      throw new NotFoundException(`Feedback with ID ${feedbackId} not found`);
    }

    const reactions = await this.reactionModel.findAll({
      where: { feedbackId },
      attributes: ['reactionType'],
    });

    const byTypeMap = new Map<FeedbackReactionType, number>();
    for (const reaction of reactions) {
      byTypeMap.set(reaction.reactionType, (byTypeMap.get(reaction.reactionType) ?? 0) + 1);
    }

    let currentUserReactionType: FeedbackReactionType | null = null;
    if (currentUserId) {
      const currentReaction = await this.reactionModel.findOne({
        where: { feedbackId, userId: currentUserId },
      });
      currentUserReactionType = currentReaction?.reactionType ?? null;
    }

    return {
      feedbackId,
      total: reactions.length,
      byType: Array.from(byTypeMap.entries()).map(([reactionType, count]) => ({
        reactionType,
        count,
      })),
      currentUserReactionType,
    };
  }
}
