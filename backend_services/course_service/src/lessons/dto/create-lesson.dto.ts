// src/models/lessons/dto/create-lesson.dto.ts
import { IsString, IsInt, IsEnum, IsObject, IsNumber, IsOptional, MaxLength } from 'class-validator';
import { ContentType, LessonStatus } from 'src/models/lesson.model';
// import { LessonStatus, ContentType } from '../enums/lesson.enum';

export class CreateLessonDto {
  @IsInt()
  @IsOptional()
  courseId: number;

  @IsString()
  @MaxLength(255)
  title: string;

  @IsEnum(ContentType)
  contentType: ContentType;

  @IsObject()
  content: Record<string, any>;

  @IsNumber()
  @IsOptional()
  duration?: number;

  @IsEnum(LessonStatus)
  @IsOptional()
  status?: LessonStatus;

  @IsString()
  @MaxLength(255)
  @IsOptional()
  description?: string;
}