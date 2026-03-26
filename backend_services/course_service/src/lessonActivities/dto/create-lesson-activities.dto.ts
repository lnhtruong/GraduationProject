// src/models/lesson-activities/dto/create-lesson-activity.dto.ts
import { IsString, IsInt, IsEnum, IsOptional } from 'class-validator';
import { ActivityStatus, ActivityType } from 'src/models/lesson-activity.model';
// import { ActivityStatus, ActivityType } from '../enums/lesson-activity.enum';

export class CreateLessonActivityDto {
  @IsInt()
  @IsOptional()
  lessonId?: number;

  @IsEnum(ActivityType)
  @IsOptional()
  activityType?: ActivityType;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @IsOptional()
  orderIndex?: number;

  @IsInt()
  @IsOptional()
  maxAttempts?: number;

  @IsEnum(ActivityStatus)
  @IsOptional()
  status?: ActivityStatus;

  @IsInt()
  @IsOptional()
  createdBy?: number;
}