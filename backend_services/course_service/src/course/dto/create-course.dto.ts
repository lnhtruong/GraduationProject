import {
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { CourseLevel } from 'src/models/course.model';

export class CreateCourseDto {
  @IsString()
  @MaxLength(255)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @MaxLength(2048)
  @IsOptional()
  thumbnailUrl?: string | null;

  @IsString()
  @MaxLength(2048)
  @IsOptional()
  thumbnail_url?: string | null;

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

  @IsInt()
  @IsOptional()
  videoId?: number | null;

  // @IsInt()
  // userId: number;
}
