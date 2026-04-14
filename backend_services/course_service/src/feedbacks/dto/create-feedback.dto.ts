import { IsInt, IsString, MaxLength, Min, Max } from 'class-validator';

export class CreateFeedbackDto {
  @IsInt()
  courseId: number;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @MaxLength(65535)
  reviewText: string;
}
