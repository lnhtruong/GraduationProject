import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ReportStatus,
  ReportTargetType,
} from 'src/models/report.model';
import { CreateReportDto } from './dto/create-report.dto';
import { ReviewReportDto } from './dto/review-report.dto';
import { ReportsService } from './reports.service';

const ADMIN_ROLE = 1;

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

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

  private assertAdmin(roleHeader?: string): void {
    const role = Number(roleHeader);
    if (!Number.isInteger(role) || role !== ADMIN_ROLE) {
      throw new UnauthorizedException('Admin permission required');
    }
  }

  @Post()
  async create(
    @Headers('x-user-id') userIdHeader: string,
    @Body() payload: CreateReportDto,
  ) {
    const userId = this.parseUserId(userIdHeader);
    return await this.reportsService.create(userId, payload);
  }

  @Get('mine')
  async listMine(
    @Headers('x-user-id') userIdHeader: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const userId = this.parseUserId(userIdHeader);
    return await this.reportsService.listByReporter(userId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get()
  async listAll(
    @Headers('x-user-role') roleHeader: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: ReportStatus,
    @Query('targetType') targetType?: ReportTargetType,
  ) {
    this.assertAdmin(roleHeader);
    return await this.reportsService.listAll({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status,
      targetType,
    });
  }

  @Get(':id')
  async getById(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-user-role') roleHeader: string,
  ) {
    this.assertAdmin(roleHeader);
    return await this.reportsService.getById(id);
  }

  @Patch(':id/review')
  async review(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-user-id') userIdHeader: string,
    @Headers('x-user-role') roleHeader: string,
    @Headers('x-forwarded-for') forwardedFor: string,
    @Headers('user-agent') userAgent: string,
    @Body() payload: ReviewReportDto,
  ) {
    this.assertAdmin(roleHeader);
    const approverId = this.parseUserId(userIdHeader);
    return await this.reportsService.review(id, approverId, payload, {
      userId: approverId,
      role: parseInt(roleHeader, 10),
      ip: forwardedFor?.split(',')[0]?.trim() ?? null,
      userAgent: userAgent ?? null,
    });
  }
}
