import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateQuizAIDto {
  @IsInt()
  lessonActivityId: number;

  /** Source video row in `videos`; `srt_raw_url` is preferred, fallback to long video URL. */
  @IsInt()
  videoId: number;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

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

  @IsBoolean()
  @IsOptional()
  isInVideo?: boolean;

  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(30)
  numQuestions?: number;

  @IsString()
  @IsOptional()
  @IsIn(['easy', 'medium', 'hard', 'mixed'])
  difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';

  @IsString()
  @IsOptional()
  @MaxLength(16)
  language?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  sourceOriginalFilename?: string;

  @Type(() => Number)
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @IsOptional()
  @Min(0)
  startTime?: number;

  @Type(() => Number)
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @IsOptional()
  @Min(0)
  endTime?: number;

  /** Accept Colab-style names too, while service normalizes them before forwarding. */
  @Type(() => Number)
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @IsOptional()
  @Min(0)
  start_time?: number;

  @Type(() => Number)
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @IsOptional()
  @Min(0)
  end_time?: number;
}
