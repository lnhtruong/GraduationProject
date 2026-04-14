import { IsBoolean, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class UpdateFeedbackDto {
  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  rating?: number;

  @IsString()
  @MaxLength(65535)
  @IsOptional()
  reviewText?: string;

  @IsBoolean()
  @IsOptional()
  isVisible?: boolean;
}
