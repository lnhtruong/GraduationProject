import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';

export class CheckEnrollExistsDto {
  @Type(() => Number)
  @IsInt()
  userId: number;

  @Type(() => Number)
  @IsInt()
  courseId: number;
}
