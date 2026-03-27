import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { QuestionType } from 'src/models/quiz-question.model';

export class CreateQuizAIDto {
  @IsInt()
  lessonActivityId: number;

  @IsString()
  @MaxLength(255)
  name: string;

  @IsBoolean()
  @IsOptional()
  shuffleQuestion?: boolean;

  @IsBoolean()
  @IsOptional()
  shuffleOption?: boolean;

  @IsNumber()
  @IsOptional()
  passingScore?: number;

  @IsInt()
  @IsOptional()
  timeLimitMinutes?: number;
}

