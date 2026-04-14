import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { LessonProgressStatus } from 'src/models/lesson-progress.model';

export class CreateLessonProgressDto {
  @IsInt()
  courseId: number;

  @IsInt()
  lessonId: number;

  @IsEnum(LessonProgressStatus)
  @IsOptional()
  progress?: LessonProgressStatus;
}
