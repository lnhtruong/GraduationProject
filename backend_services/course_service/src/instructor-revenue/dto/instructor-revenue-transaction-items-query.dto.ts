import { IsOptional, IsString } from 'class-validator';

export class InstructorRevenueTransactionItemsQueryDto {
  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;
}
