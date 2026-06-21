import { Controller, Get, Query } from '@nestjs/common';
import { AdminRevenueService } from './admin-revenue.service';
import { AdminRevenueTimeseriesQueryDto } from './dto/admin-revenue-timeseries-query.dto';
import { AdminRevenueTransactionsQueryDto } from './dto/admin-revenue-transactions-query.dto';

// Admin-only platform-wide revenue analytics. Role enforcement is done at the
// API gateway (access-policy: roles=[ADMIN]).
@Controller('admin/revenue')
export class AdminRevenueController {
  constructor(private readonly adminRevenueService: AdminRevenueService) {}

  @Get('summary')
  getSummary() {
    return this.adminRevenueService.getSummary();
  }

  @Get('timeseries')
  getTimeseries(@Query() query: AdminRevenueTimeseriesQueryDto) {
    return this.adminRevenueService.getTimeseries(query);
  }

  @Get('by-category')
  getByCategory(@Query('from') from?: string, @Query('to') to?: string) {
    return this.adminRevenueService.getByCategory(from, to);
  }

  @Get('transactions')
  getTransactions(@Query() query: AdminRevenueTransactionsQueryDto) {
    return this.adminRevenueService.getTransactions(query);
  }
}
