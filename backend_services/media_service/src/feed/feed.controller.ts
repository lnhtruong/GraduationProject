import {
  UnauthorizedException,
  ForbiddenException,
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { FeedService } from './feed.service';
import { FeedInteractionType } from '../models/feed_interactions.model';
import { HighlightFeedStatus } from '../models/highlight_feed.model';

@Controller('feed')
export class FeedController {
  constructor(private readonly feedService: FeedService) { }

  private parseRequiredUserId(userIdHeader?: string): number {
    const userId = Number(userIdHeader);
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new UnauthorizedException('Authentication required');
    }
    return userId;
  }

  private parseAnalyticsRole(roleHeader?: string): number {
    const role = Number(roleHeader);
    if (!Number.isInteger(role)) {
      throw new UnauthorizedException('User role is required');
    }
    if (role !== 1 && role !== 3) {
      throw new ForbiddenException('Lecturer or admin permission required');
    }
    return role;
  }

  @Post()
  async addToFeed(
    @Headers('x-user-id') userIdHeader: string,
    @Body() body: { video_id: number; course_id: number; title?: string; caption?: string; hashtags?: string[] },
  ) {
    const userId = parseInt(userIdHeader, 10);
    if (!userId || isNaN(userId)) {
      throw new BadRequestException('User not authenticated');
    }
    return this.feedService.addToFeed(
      userId,
      body.video_id,
      body.course_id,
      body.title,
      body.caption,
      body.hashtags,
    );
  }

  @Get()
  async getFeed(
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
    @Query('courseId') courseId?: string,
    @Query('mode') mode: 'recommended' | 'search' = 'search',
    @Query('search') search?: string,
    @Query('sessionId') sessionId?: string,
    @Headers('x-user-id') userIdHeader?: string,
  ) {
    const cursorId = cursor ? parseInt(cursor, 10) : undefined;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    const courseIdNum = courseId ? parseInt(courseId, 10) : undefined;
    const userId = userIdHeader ? parseInt(userIdHeader, 10) : undefined;

    return this.feedService.getFeed(
      cursorId,
      limitNum,
      userId,
      courseIdNum,
      mode,
      search,
      sessionId,
    );
  }

  @Get('viewed')
  async getViewedFeeds(@Headers('x-user-id') userIdHeader?: string) {
    const userId = this.parseRequiredUserId(userIdHeader);
    return this.feedService.getViewedFeeds(userId);
  }

  @Get('saved')
  async getSavedFeeds(@Headers('x-user-id') userIdHeader?: string) {
    const userId = this.parseRequiredUserId(userIdHeader);
    return this.feedService.getSavedFeeds(userId);
  }

  /**
   * GET /feed/mine — feeds the current user (lecturer/admin) has posted.
   *
   * Offset-based pagination tailored to the lecturer management UI: returns
   * a `pagination` envelope with `total` and `totalPages` so the frontend can
   * render a pager and jump to a specific page.
   *
   * Query params (all optional):
   *  - `page`     1-indexed page number, default 1
   *  - `pageSize` Items per page, default 20, max 100
   *  - `courseId` Filter by course id
   *  - `status`   `active | hidden | removed` — defaults to all
   *  - `sortBy`   `created_at | id | title` — default `created_at`
   *  - `order`    `asc | desc` — default `desc`
   *
   * Returns all statuses by default so the lecturer can manage drafts.
   * The response item includes `status` and `created_at` fields on top of
   * the standard feed shape.
   */
  @Get('mine')
  async getMyFeeds(
    @Headers('x-user-id') userIdHeader?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('courseId') courseId?: string,
    @Query('status') status?: string,
    @Query('sortBy') sortBy?: string,
    @Query('order') order?: string,
  ) {
    const userId = this.parseRequiredUserId(userIdHeader);

    const pageNum = page ? parseInt(page, 10) : 1;
    const pageSizeNum = pageSize ? parseInt(pageSize, 10) : 20;
    const courseIdNum = courseId ? parseInt(courseId, 10) : undefined;

    if (page && (!Number.isFinite(pageNum) || pageNum < 1)) {
      throw new BadRequestException('Invalid page (must be a positive integer)');
    }
    if (pageSize && (!Number.isFinite(pageSizeNum) || pageSizeNum < 1)) {
      throw new BadRequestException('Invalid pageSize (must be a positive integer)');
    }
    if (courseId && (courseIdNum === undefined || Number.isNaN(courseIdNum) || courseIdNum <= 0)) {
      throw new BadRequestException('Invalid courseId');
    }

    let statusEnum: HighlightFeedStatus | undefined;
    if (status) {
      const allowed = Object.values(HighlightFeedStatus);
      if (!(allowed as string[]).includes(status)) {
        throw new BadRequestException(
          `Invalid status. Allowed: ${(allowed as string[]).join(', ')}`,
        );
      }
      statusEnum = status as HighlightFeedStatus;
    }

    const allowedSort = ['created_at', 'id', 'title'] as const;
    type SortBy = typeof allowedSort[number];
    const sortByVal: SortBy = (allowedSort as readonly string[]).includes(sortBy ?? '')
      ? (sortBy as SortBy)
      : 'created_at';

    const orderVal: 'asc' | 'desc' = order === 'asc' ? 'asc' : 'desc';

    return this.feedService.getMyFeeds(
      userId,
      pageNum,
      pageSizeNum,
      courseIdNum,
      statusEnum,
      sortByVal,
      orderVal,
    );
  }

  @Get('trending')
  async getPublicTrending(@Query('limit') limit?: string) {
    const limitNum = limit ? Number(limit) : undefined;
    return this.feedService.getPublicTrending(limitNum);
  }

  @Get('stats/creator')
  async getCreatorStats(
    @Headers('x-user-id') userIdHeader?: string,
    @Headers('x-user-role') roleHeader?: string,
    @Query('period') period?: string,
    @Query('limit') limit?: string,
  ) {
    const userId = this.parseRequiredUserId(userIdHeader);
    const role = this.parseAnalyticsRole(roleHeader);
    const limitNum = limit ? Number(limit) : undefined;

    return this.feedService.getCreatorStats(userId, role, period, limitNum);
  }

  @Get('stats/trending')
  async getTrendingStats(
    @Headers('x-user-id') userIdHeader?: string,
    @Headers('x-user-role') roleHeader?: string,
    @Query('period') period?: string,
    @Query('limit') limit?: string,
  ) {
    const userId = this.parseRequiredUserId(userIdHeader);
    const role = this.parseAnalyticsRole(roleHeader);
    const limitNum = limit ? Number(limit) : undefined;

    return this.feedService.getTrendingStats(userId, role, period, limitNum);
  }

  @Get(':id/stats')
  async getFeedDetailStats(
    @Param('id', ParseIntPipe) feedId: number,
    @Headers('x-user-id') userIdHeader?: string,
    @Headers('x-user-role') roleHeader?: string,
  ) {
    const userId = this.parseRequiredUserId(userIdHeader);
    const role = this.parseAnalyticsRole(roleHeader);

    return this.feedService.getFeedDetailStats(feedId, userId, role);
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
    @Body() body: { title?: string; caption?: string; hashtags?: string[]; status?: string },
  ) {
    const userId = parseInt(userIdHeader, 10);
    if (!userId || isNaN(userId)) {
      throw new BadRequestException('User not authenticated');
    }
    return this.feedService.updateFeed(userId, feedId, body.title, body.caption, body.hashtags, body.status);
  }

  @Post(':id/comments')
  async createComment(
    @Param('id', ParseIntPipe) feedId: number,
    @Headers('x-user-id') userIdHeader: string,
    @Body() body: { content: string; origin_cmt?: number | null },
  ) {
    const userId = parseInt(userIdHeader, 10);
    if (!userId || isNaN(userId)) {
      throw new BadRequestException('User not authenticated');
    }
    return this.feedService.createComment(userId, feedId, body.content, body.origin_cmt);
  }

  @Get(':id/comments')
  async getComments(
    @Param('id', ParseIntPipe) feedId: number,
    @Query('cursor') cursor?: string,
    @Query('userId') userId?: number,
    @Query('limit') limit?: string,
    @Headers('x-user-id') userIdHeader?: string,
  ) {
    const cursorId = cursor ? parseInt(cursor, 10) : undefined;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const user_id = userId ? userId : userIdHeader ? parseInt(userIdHeader, 10) : undefined;
    return this.feedService.getComments(feedId, cursorId, limitNum, user_id);
  }

  @Get(':id/comment/detail')
  async getCommentDetail(
    @Param('id', ParseIntPipe) feedId: number,
    @Query('origin_cmt') originCmt?: string,
    @Query('userId') userId?: number,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
    @Headers('x-user-id') userIdHeader?: string,
  ) {
    const originCmtNum = originCmt ? parseInt(originCmt, 10) : undefined;
    if (!originCmtNum || Number.isNaN(originCmtNum)) {
      throw new BadRequestException('origin_cmt is required');
    }
    const cursorId = cursor ? parseInt(cursor, 10) : undefined;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const user_id = userId ? userId : userIdHeader ? parseInt(userIdHeader, 10) : undefined;
    return this.feedService.getCommentDetail(feedId, originCmtNum, cursorId, limitNum, user_id);
  }

  @Patch(':id/comments/:commentId')
  async updateComment(
    @Param('id', ParseIntPipe) feedId: number,
    @Param('commentId', ParseIntPipe) commentId: number,
    @Headers('x-user-id') userIdHeader: string,
    @Body() body: { content: string },
  ) {
    const userId = parseInt(userIdHeader, 10);
    if (!userId || isNaN(userId)) {
      throw new BadRequestException('User not authenticated');
    }
    return this.feedService.updateComment(userId, feedId, commentId, body.content);
  }

  @Delete(':id/comments/:commentId')
  async deleteComment(
    @Param('id', ParseIntPipe) feedId: number,
    @Param('commentId', ParseIntPipe) commentId: number,
    @Headers('x-user-id') userIdHeader: string,
  ) {
    const userId = parseInt(userIdHeader, 10);
    if (!userId || isNaN(userId)) {
      throw new BadRequestException('User not authenticated');
    }
    return this.feedService.deleteComment(userId, feedId, commentId);
  }
}