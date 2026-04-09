import {
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { CourseLevel, CourseStatus } from 'src/models/course.model';

export class CreateCourseDto {
  @IsString()
  @MaxLength(255)
  name: string;

  @IsString()
  @MaxLength(255)
  @IsOptional()
  description?: string;

  @IsArray()
  categories: string[];

  @IsEnum(CourseLevel)
  @IsOptional()
  level?: CourseLevel;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/)
  duration: string;

  @IsString()
  @MaxLength(255)
  language: string;

  @IsNumber()
  price: number;

  @IsInt()
  userId: number;

  @IsEnum(CourseStatus)
  @IsOptional()
  status?: CourseStatus;
}
