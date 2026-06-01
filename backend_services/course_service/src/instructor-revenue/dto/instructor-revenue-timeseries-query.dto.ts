import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';

export type RevenueGranularity = 'daily' | 'weekly' | 'monthly';

export class InstructorRevenueTimeseriesQueryDto {
  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;

  @IsOptional()
  @IsIn(['daily', 'weekly', 'monthly'])
  granularity?: RevenueGranularity;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  includeCourses?: boolean;
}
