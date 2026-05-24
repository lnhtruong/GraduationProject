import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  Min,
  ValidateNested,
} from 'class-validator';

export class SubmitQuizAnswerDto {
  @IsInt()
  @Min(1)
  questionId: number;

  @IsInt()
  @Min(1)
  selectedOptionId: number;
}

export class SubmitQuizDto {
  @IsInt()
  @Min(1)
  quizId: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SubmitQuizAnswerDto)
  answers: SubmitQuizAnswerDto[];

  @IsOptional()
  @IsInt()
  @Min(0)
  timeSpentSeconds?: number;
}
