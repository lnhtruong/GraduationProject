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
  @IsOptional()
  description?: string;

  @IsArray()
  categories: string[];

  @IsEnum(CourseLevel)
  @IsOptional()
  level?: CourseLevel;


  @IsString()
  @MaxLength(255)
  language: string;

  @IsNumber()
  price: number;

  // @IsInt()
  // userId: number;
}
