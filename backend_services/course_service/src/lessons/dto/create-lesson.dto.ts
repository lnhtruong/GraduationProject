// src/models/lessons/dto/create-lesson.dto.ts
import { IsString, IsInt, IsEnum, IsObject, IsOptional, MaxLength, Matches } from 'class-validator';
import { ContentType, LessonStatus } from 'src/models/lesson.model';
// import { LessonStatus, ContentType } from '../enums/lesson.enum';

export class CreateLessonDto {
  @IsInt()
  @IsOptional()
  courseId: number;

  @IsInt()
  @IsOptional()
  videoId?: number | null;

  @IsString()
  @MaxLength(255)
  title: string;

  @IsEnum(ContentType)
  contentType: ContentType;

  @IsObject()
  content: Record<string, any>;

  @Matches(/^\d{2,3}:[0-5]\d:[0-5]\d(\.\d{1,3})?$/)
  @IsOptional()
  duration?: string;

  @IsEnum(LessonStatus)
  @IsOptional()
  status?: LessonStatus;

  @IsString()
  @MaxLength(255)
  @IsOptional()
  description?: string;
}