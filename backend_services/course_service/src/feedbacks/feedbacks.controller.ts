import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';
import { FeedbacksService } from './feedbacks.service';

const ADMIN_ROLE = 1;

@Controller('feedbacks')
export class FeedbacksController {
  constructor(private readonly feedbacksService: FeedbacksService) { }

  private parseUserId(userIdHeader?: string): number {
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

  private assertAdmin(roleHeader?: string): void {
    const role = Number(roleHeader);
    console.log("check role: ", role);
    if (!Number.isInteger(role) || role !== ADMIN_ROLE) {
      throw new UnauthorizedException('Admin permission required');
    }
  }

  @Post()
  async create(@Headers('x-user-id') userIdHeader: string, @Body() payload: CreateFeedbackDto) {
    const userId = this.parseUserId(userIdHeader);
    return await this.feedbacksService.create(userId, payload);
  }

  @Get('check/:courseId')
  async hasUserReviewedCourse(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Headers('x-user-id') userIdHeader: string,
  ) {
    console.log("check userIdHeader: ", userIdHeader);
    const userId = this.parseUserId(userIdHeader);
    return await this.feedbacksService.hasUserReviewedCourse(userId, courseId);
  }

  @Get(':courseId')
  async listByCourse(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('userId') userIdHeader?: string,
  ) {
    const parsedPage = page ? Number(page) : undefined;
    const parsedLimit = limit ? Number(limit) : undefined;
    const currentUserId = this.parseOptionalUserId(userIdHeader);
    return await this.feedbacksService.listByCourse(courseId, parsedPage, parsedLimit, currentUserId);
  }

  @Patch(':id')
  async updateByAdmin(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-user-role') roleHeader: string,
    @Body() payload: UpdateFeedbackDto,
  ) {
    this.assertAdmin(roleHeader);
    return await this.feedbacksService.updateByAdmin(id, payload);
  }

  @Delete(':id')
  async removeByAdmin(@Param('id', ParseIntPipe) id: number, @Headers('x-user-role') roleHeader: string) {
    this.assertAdmin(roleHeader);
    await this.feedbacksService.removeByAdmin(id);
    return { success: true };
  }
}
