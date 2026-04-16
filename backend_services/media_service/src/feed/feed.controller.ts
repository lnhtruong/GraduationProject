import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  Headers,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { FeedService } from './feed.service';
import { FeedInteractionType } from '../models/feed_interactions.model';

@Controller('feed')
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @Post()
  async addToFeed(
    @Headers('x-user-id') userIdHeader: string,
    @Body() body: { video_id: number; course_id: number; title?: string; hashtags?: string[] },
  ) {
    const userId = parseInt(userIdHeader, 10);
    if (!userId || isNaN(userId)) {
      throw new BadRequestException('User not authenticated');
    }
    return this.feedService.addToFeed(userId, body.video_id, body.course_id, body.title, body.hashtags);
  }

  @Get()
  async getFeed(
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
    @Query('courseId') courseId?: string,
    @Headers('x-user-id') userIdHeader?: string,
  ) {
    const cursorId = cursor ? parseInt(cursor, 10) : undefined;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    const courseIdNum = courseId ? parseInt(courseId, 10) : undefined;
    const userId = userIdHeader ? parseInt(userIdHeader, 10) : undefined;
    return this.feedService.getFeed(cursorId, limitNum, userId, courseIdNum);
  }

  @Post(':id/interact')
  async interact(
    @Param('id', ParseIntPipe) feedId: number,
    @Headers('x-user-id') userIdHeader: string,
    @Body() body: { type: FeedInteractionType },
  ) {
    const userId = parseInt(userIdHeader, 10);
    if (!userId || isNaN(userId)) {
      throw new BadRequestException('User not authenticated');
    }
    return this.feedService.interactWithFeed(userId, feedId, body.type);
  }

  @Post(':id/view')
  async recordView(
    @Param('id', ParseIntPipe) feedId: number,
    @Headers('x-user-id') userIdHeader: string,
    @Body() body: { watch_duration: number; completed: boolean },
  ) {
    const userId = parseInt(userIdHeader, 10);
    if (!userId || isNaN(userId)) {
      throw new BadRequestException('User not authenticated');
    }
    return this.feedService.recordView(userId, feedId, body.watch_duration, body.completed);
  }

  @Put(':id')
  async updateFeed(
    @Param('id', ParseIntPipe) feedId: number,
    @Headers('x-user-id') userIdHeader: string,
    @Body() body: { title?: string; hashtags?: string[]; status?: string },
  ) {
    const userId = parseInt(userIdHeader, 10);
    if (!userId || isNaN(userId)) {
      throw new BadRequestException('User not authenticated');
    }
    return this.feedService.updateFeed(userId, feedId, body.title, body.hashtags, body.status);
  }
}