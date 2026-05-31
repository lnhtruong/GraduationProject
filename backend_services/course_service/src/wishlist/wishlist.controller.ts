import {
  Body,
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
import { CreateWishlistDto } from './dto/create-wishlist.dto';
import { WishlistService } from './wishlist.service';

function parseUserId(header?: string): number {
  if (!header) throw new UnauthorizedException('Authentication required');
  const id = Number(header);
  if (!Number.isInteger(id) || id <= 0) {
    throw new UnauthorizedException('Invalid user id');
  }
  return id;
}

@Controller('wishlist')
export class WishlistController {
  constructor(private readonly service: WishlistService) {}

  @Get()
  async list(
    @Headers('x-user-id') userIdHeader: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const userId = parseUserId(userIdHeader);
    return this.service.list(userId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Post()
  async add(
    @Headers('x-user-id') userIdHeader: string,
    @Body() dto: CreateWishlistDto,
  ) {
    const userId = parseUserId(userIdHeader);
    return this.service.add(userId, dto.courseId);
  }

  @Delete(':courseId')
  @HttpCode(204)
  async remove(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Headers('x-user-id') userIdHeader: string,
  ): Promise<void> {
    const userId = parseUserId(userIdHeader);
    await this.service.remove(userId, courseId);
  }

  @Get('check/:courseId')
  async check(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Headers('x-user-id') userIdHeader: string,
  ) {
    const userId = parseUserId(userIdHeader);
    return this.service.check(userId, courseId);
  }
}
