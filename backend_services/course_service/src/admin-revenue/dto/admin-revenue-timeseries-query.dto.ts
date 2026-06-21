import { IsIn, IsOptional, IsString } from 'class-validator';

export type RevenueGranularity = 'daily' | 'weekly' | 'monthly';

export class AdminRevenueTimeseriesQueryDto {
  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;

  @IsOptional()
  @IsIn(['daily', 'weekly', 'monthly'])
  granularity?: RevenueGranularity;
}
