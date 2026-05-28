import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { UserRole } from '../users/users.service';
import { CreateLecturerRequestDto } from './dto/create-lecturer-request.dto';
import { ReviewLecturerRequestDto } from './dto/review-lecturer-request.dto';
import { LecturerRequestStatus } from './lecturer-request.model';
import { LecturerRequestsService } from './lecturer-requests.service';

@Controller('users/lecturer-requests')
export class LecturerRequestsController {
  constructor(
    private readonly lecturerRequestsService: LecturerRequestsService,
  ) {}

  @Post()
  async create(
    @Headers('x-user-id') userIdHeader: string,
    @Body() payload: CreateLecturerRequestDto,
  ) {
    const userId = this.parseUserId(userIdHeader);
    return this.lecturerRequestsService.create(userId, payload);
  }

  @Get('mine')
  async listMine(
    @Headers('x-user-id') userIdHeader: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: LecturerRequestStatus,
  ) {
    const userId = this.parseUserId(userIdHeader);
    return this.lecturerRequestsService.listMine(userId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status,
    });
  }

  @Get()
  async listAll(
    @Headers('x-user-role') roleHeader: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: LecturerRequestStatus,
  ) {
    this.assertAdmin(roleHeader);
    return this.lecturerRequestsService.listAll({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status,
    });
  }

  @Get(':id')
  async getById(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-user-id') userIdHeader: string,
    @Headers('x-user-role') roleHeader: string,
  ) {
    const userId = this.parseUserId(userIdHeader);
    const role = this.parseRole(roleHeader);

    const request = await this.lecturerRequestsService.getById(id);
    if (role !== UserRole.ADMIN && request.userId !== userId) {
      throw new ForbiddenException('You can only view your own request');
    }
    return request;
  }

  @Patch(':id/review')
  async review(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-user-id') userIdHeader: string,
    @Headers('x-user-role') roleHeader: string,
    @Body() payload: ReviewLecturerRequestDto,
  ) {
    this.assertAdmin(roleHeader);
    const reviewerId = this.parseUserId(userIdHeader);
    return this.lecturerRequestsService.review(id, reviewerId, payload);
  }

  private parseUserId(userIdHeader?: string): number {
    const userId = parseInt(userIdHeader ?? '', 10);
    if (!userId || Number.isNaN(userId)) {
      throw new BadRequestException('User ID not found in request headers');
    }
    return userId;
  }

  private parseRole(roleHeader?: string): number {
    const role = parseInt(roleHeader ?? '', 10);
    if (Number.isNaN(role)) {
      throw new BadRequestException('User role not found in request headers');
    }
    return role;
  }

  private assertAdmin(roleHeader?: string): void {
    if (this.parseRole(roleHeader) !== UserRole.ADMIN) {
      throw new ForbiddenException('Admin permission required');
    }
  }
}
