import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
  IsIn,
  Min,
  Max,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Legacy evidence object — Colab `validate_questions()` cũ.
 * `start_ms`/`end_ms` đã được tự-re-compute từ srt_indices thật.
 */
export class QuizQuestionEvidenceDto {
  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsString()
  text_from_srt?: string;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  srt_indices?: number[];

  @IsInt()
  @Min(0)
  start_ms: number;

  @IsInt()
  @Min(0)
  end_ms: number;
}

/** Option object từ prompt Colab mới (`optionText`, `isCorrect`, `orderIndex`). */
export class QuizOptionFromAIDto {
  @IsString()
  optionText: string;

  @IsBoolean()
  isCorrect: boolean;

  @IsInt()
  @Min(1)
  orderIndex: number;
}

export class QuizQuestionFromAIDto {
  @IsOptional()
  @IsInt()
  id?: number;

  @IsString()
  question: string;

  /**
   * Colab mới: array of option objects. Legacy: `{a, b, c, d}` map.
   * Shape được validate trong `QuizzesService.toRowFromAI`.
   */
  @IsOptional()
  options?: QuizOptionFromAIDto[] | Record<string, string>;

  /** Legacy: `"a" | "b" | "c" | "d"` — chỉ dùng khi `options` là map. */
  @IsOptional()
  @IsString()
  @IsIn(['a', 'b', 'c', 'd'])
  correct?: 'a' | 'b' | 'c' | 'd';

  /** Colab mới: `mcq` | `true_false`. */
  @IsOptional()
  @IsString()
  @IsIn(['mcq', 'true_false'])
  type?: 'mcq' | 'true_false';

  /** Colab mới: 0-based index — metadata, DB dùng `options[].isCorrect`. */
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(3)
  correct_index?: number;

  @IsOptional()
  @IsString()
  explanation?: string;

  /** Colab mới: `"HH:MM:SS,mmm"` string. Legacy: `{ start_ms, end_ms, ... }`. */
  @IsOptional()
  evidence?: string | QuizQuestionEvidenceDto;

  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}:\d{2}[,.]\d{3}$/)
  evidenceTimestamp?: string;

  @IsOptional()
  @IsString()
  @IsIn(['easy', 'medium', 'hard'])
  difficulty?: 'easy' | 'medium' | 'hard';
}

/**
 * Body cho `POST /quizzes/from-ai` — endpoint nhận quiz pre-generated từ Colab.
 *
 * Async flow:
 *   Colab → QStash → media_service webhook → course_service /quizzes/from-ai
 */
export class CreateQuizFromAIDto {
  @IsInt()
  lessonActivityId: number;

  @IsInt()
  videoId: number;

  @IsString()
  @IsOptional()
  name?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuizQuestionFromAIDto)
  questions: QuizQuestionFromAIDto[];

  @IsBoolean()
  @IsOptional()
  shuffleQuestion?: boolean;

  @IsBoolean()
  @IsOptional()
  shuffleOption?: boolean;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  passingScore?: number;

  @IsInt()
  @IsOptional()
  timeLimitMinutes?: number;

  /** `true` → quiz hiển thị inline trong video tại `evidence` / `evidenceTimestamp`. */
  @IsBoolean()
  @IsOptional()
  isInVideo?: boolean;

  @IsOptional()
  @IsString()
  jobId?: string;

  @IsOptional()
  @IsString()
  model?: string;
}
