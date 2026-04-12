import { IsInt } from 'class-validator';

export class CreateEnrollDto {
  @IsInt()
  courseId: number;
}
