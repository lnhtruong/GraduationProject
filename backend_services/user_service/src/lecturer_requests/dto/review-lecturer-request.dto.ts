import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class ReviewLecturerRequestDto {
  @IsBoolean()
  approve: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  reviewNote?: string;
}
