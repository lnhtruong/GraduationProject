import {
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { FollowsService } from './follows.service';

function parseUserId(header?: string): number {
  if (!header) throw new UnauthorizedException('Authentication required');
  const id = Number(header);
  if (!Number.isInteger(id) || id <= 0) {
    throw new UnauthorizedException('Invalid user id');
  }
  return id;
}

function parseOptionalUserId(header?: string): number | undefined {
  if (!header) return undefined;
  const id = Number(header);
  return Number.isInteger(id) && id > 0 ? id : undefined;
}

@Controller('instructors')
export class InstructorsFollowController {
  constructor(private readonly service: FollowsService) {}

  @Post(':id/follow')
  async follow(
    @Param('id', ParseIntPipe) instructorId: number,
    @Headers('x-user-id') userIdHeader: string,
  ) {
    const userId = parseUserId(userIdHeader);
    return this.service.follow(userId, instructorId);
  }

  @Delete(':id/follow')
  @HttpCode(204)
  async unfollow(
    @Param('id', ParseIntPipe) instructorId: number,
    @Headers('x-user-id') userIdHeader: string,
  ): Promise<void> {
    const userId = parseUserId(userIdHeader);
    await this.service.unfollow(userId, instructorId);
  }

  @Get(':id/stats')
  async stats(
    @Param('id', ParseIntPipe) instructorId: number,
    @Headers('x-user-id') userIdHeader?: string,
  ) {
    const viewerId = parseOptionalUserId(userIdHeader);
    return this.service.stats(instructorId, viewerId);
  }
}

@Controller('users')
export class UsersFollowingController {
  constructor(private readonly service: FollowsService) {}

  @Get('following')
  async list(
    @Headers('x-user-id') userIdHeader: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const userId = parseUserId(userIdHeader);
    return this.service.listFollowing(userId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }
}
