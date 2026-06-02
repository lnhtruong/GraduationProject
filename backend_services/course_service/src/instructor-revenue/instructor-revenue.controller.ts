import {
  Controller,
  Get,
  Headers,
  Param,
  ParseIntPipe,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { InstructorRevenueTransactionItemsQueryDto } from './dto/instructor-revenue-transaction-items-query.dto';
import { InstructorRevenueTimeseriesQueryDto } from './dto/instructor-revenue-timeseries-query.dto';
import { InstructorRevenueService } from './instructor-revenue.service';

@Controller('instructor/revenue')
export class InstructorRevenueController {
  constructor(
    private readonly instructorRevenueService: InstructorRevenueService,
  ) { }

  @Get('summary')
  getSummary(@Headers('x-user-id') userIdHeader?: string) {
    const instructorId = this.parseRequiredUserId(userIdHeader);
    return this.instructorRevenueService.getSummary(instructorId);
  }

  @Get('timeseries')
  getTimeseries(
    @Query() query: InstructorRevenueTimeseriesQueryDto,
    @Headers('x-user-id') userIdHeader?: string,
  ) {
    const instructorId = this.parseRequiredUserId(userIdHeader);
    return this.instructorRevenueService.getTimeseries(instructorId, query);
  }

  @Get(':courseId/transaction-items')
  getTransactionItems(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Query() query: InstructorRevenueTransactionItemsQueryDto,
    @Headers('x-user-id') userIdHeader?: string,
  ) {
    const instructorId = this.parseRequiredUserId(userIdHeader);
    return this.instructorRevenueService.getTransactionItems(
      instructorId,
      courseId,
      query,
    );
  }

  private parseRequiredUserId(userIdHeader?: string): number {
    const userId = Number(userIdHeader);
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new UnauthorizedException('Authentication required');
    }
    return userId;
  }
}
