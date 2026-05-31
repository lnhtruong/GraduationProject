import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateDiscussionDto } from './dto/create-discussion.dto';
import { UpdateDiscussionDto } from './dto/update-discussion.dto';
import {
  DiscussionsService,
  DiscussionSort,
  DiscussionStatus,
} from './discussions.service';

function parseUserId(header?: string): number {
  if (!header) throw new UnauthorizedException('Authentication required');
  const id = Number(header);
  if (!Number.isInteger(id) || id <= 0) {
    throw new UnauthorizedException('Invalid user id');
  }
  return id;
}

function parseRole(header?: string): number {
  if (!header) return 0;
  const role = Number(header);
  return Number.isInteger(role) ? role : 0;
}

@Controller()
export class DiscussionsController {
  constructor(private readonly service: DiscussionsService) {}

  @Get('lessons/:lessonId/discussions')
  async listByLesson(
    @Param('lessonId', ParseIntPipe) lessonId: number,
    @Headers('x-user-id') userIdHeader: string,
    @Headers('x-user-role') roleHeader: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sort') sort?: string,
  ) {
    const userId = parseUserId(userIdHeader);
    const role = parseRole(roleHeader);
    const sortVal: DiscussionSort = sort === 'upvotes' ? 'upvotes' : 'newest';
    return this.service.listByLesson(lessonId, userId, role, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      sort: sortVal,
    });
  }

  @Post('lessons/:lessonId/discussions')
  async create(
    @Param('lessonId', ParseIntPipe) lessonId: number,
    @Headers('x-user-id') userIdHeader: string,
    @Headers('x-user-role') roleHeader: string,
    @Body() dto: CreateDiscussionDto,
  ) {
    const userId = parseUserId(userIdHeader);
    const role = parseRole(roleHeader);
    return this.service.createForLesson(lessonId, userId, role, dto);
  }

  @Patch('discussions/:postId')
  async update(
    @Param('postId', ParseIntPipe) postId: number,
    @Headers('x-user-id') userIdHeader: string,
    @Body() dto: UpdateDiscussionDto,
  ) {
    const userId = parseUserId(userIdHeader);
    return this.service.update(postId, userId, dto);
  }

  @Delete('discussions/:postId')
  @HttpCode(204)
  async remove(
    @Param('postId', ParseIntPipe) postId: number,
    @Headers('x-user-id') userIdHeader: string,
    @Headers('x-user-role') roleHeader: string,
  ): Promise<void> {
    const userId = parseUserId(userIdHeader);
    const role = parseRole(roleHeader);
    await this.service.remove(postId, userId, role);
  }

  @Post('discussions/:postId/upvote')
  async toggleUpvote(
    @Param('postId', ParseIntPipe) postId: number,
    @Headers('x-user-id') userIdHeader: string,
  ) {
    const userId = parseUserId(userIdHeader);
    return this.service.toggleUpvote(postId, userId);
  }

  @Patch('discussions/:postId/best-answer')
  async toggleBestAnswer(
    @Param('postId', ParseIntPipe) postId: number,
    @Headers('x-user-id') userIdHeader: string,
    @Headers('x-user-role') roleHeader: string,
  ) {
    const userId = parseUserId(userIdHeader);
    const role = parseRole(roleHeader);
    return this.service.toggleBestAnswer(postId, userId, role);
  }

  @Get('courses/:courseId/discussions')
  async listByCourse(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Headers('x-user-id') userIdHeader: string,
    @Headers('x-user-role') roleHeader: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('lessonId') lessonId?: string,
    @Query('status') status?: string,
  ) {
    const userId = parseUserId(userIdHeader);
    const role = parseRole(roleHeader);
    const statusVal: DiscussionStatus | undefined =
      status === 'answered' || status === 'unanswered' ? status : undefined;
    return this.service.listByCourse(courseId, userId, role, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      lessonId: lessonId ? Number(lessonId) : undefined,
      status: statusVal,
    });
  }
}
