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

export class CreateQuizOptionDto {
  @IsString()
  optionText: string;

  @IsBoolean()
  @IsOptional()
  isCorrect?: boolean;

  @IsInt()
  @IsOptional()
  orderIndex?: number;
}

export class CreateQuizQuestionDto {
  @IsEnum(QuestionType)
  quesType: QuestionType;

  @IsString()
  quesText: string;

  @IsNumber()
  @IsOptional()
  point?: number;

  @IsString()
  @IsOptional()
  correctAns?: string;

  @IsInt()
  @IsOptional()
  orderIndex?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuizOptionDto)
  @IsOptional()
  options?: CreateQuizOptionDto[];
}

export class CreateQuizDto {
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

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuizQuestionDto)
  @IsOptional()
  questions?: CreateQuizQuestionDto[];
}

