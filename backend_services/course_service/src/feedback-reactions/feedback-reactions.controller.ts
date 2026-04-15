import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateFeedbackReactionDto } from './dto/create-feedback-reaction.dto';
import { FeedbackReactionsService } from './feedback-reactions.service';

@Controller('feedback-reactions')
export class FeedbackReactionsController {
  constructor(private readonly feedbackReactionsService: FeedbackReactionsService) { }

  private parseRequiredUserId(userIdHeader?: string): number {
    if (!userIdHeader) {
      throw new UnauthorizedException('Authentication required');
    }
    const userId = Number(userIdHeader);
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new UnauthorizedException('Invalid user ID');
    }
    return userId;
  }

  private parseOptionalUserId(userIdHeader?: string): number | undefined {
    if (!userIdHeader) {
      return undefined;
    }
    const userId = Number(userIdHeader);
    if (!Number.isInteger(userId) || userId <= 0) {
      return undefined;
    }
    return userId;
  }

  @Post()
  async createOrUpdate(
    @Headers('x-user-id') userIdHeader: string,
    @Body() payload: CreateFeedbackReactionDto,
  ) {
    const userId = this.parseRequiredUserId(userIdHeader);
    console.log('check 1: ', userId);
    // return await this.feedbackReactionsService.createOrUpdate(userId, payload);
  }

  @Delete('feedback/:feedbackId')
  async removeByUser(
    @Headers('x-user-id') userIdHeader: string,
    @Param('feedbackId', ParseIntPipe) feedbackId: number,
  ) {
    const userId = this.parseRequiredUserId(userIdHeader);
    await this.feedbackReactionsService.removeByUser(userId, feedbackId);
    return { success: true };
  }

  @Get('feedback/:feedbackId')
  async getSummary(
    @Param('feedbackId', ParseIntPipe) feedbackId: number,
    @Query('userId') userIdHeader?: string,
  ) {
    const currentUserId = this.parseOptionalUserId(userIdHeader);
    return await this.feedbackReactionsService.getSummary(feedbackId, currentUserId);
  }
}
