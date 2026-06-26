import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class ReviewChangeRequestDto {
  @IsIn(['approved', 'rejected'])
  decision: 'approved' | 'rejected';

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  note?: string;
}
