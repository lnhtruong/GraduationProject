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
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Evidence kèm theo mỗi câu hỏi — đến từ Colab notebook `unified_main.py validate_questions()`.
 * `start_ms`/`end_ms` đã được tự-re-compute từ srt_indices thật (không tin LLM hallucinate).
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

export class QuizQuestionFromAIDto {
  @IsString()
  question: string;

  /** `{a: "...", b: "...", c: "...", d: "..."}` */
  @IsOptional()
  options?: Record<string, string>;

  /** `"a" | "b" | "c" | "d"` */
  @IsString()
  @IsIn(['a', 'b', 'c', 'd'])
  correct: 'a' | 'b' | 'c' | 'd';

  @IsOptional()
  @IsString()
  explanation?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => QuizQuestionEvidenceDto)
  evidence?: QuizQuestionEvidenceDto;

  @IsOptional()
  @IsString()
  @IsIn(['easy', 'medium', 'hard'])
  difficulty?: 'easy' | 'medium' | 'hard';
}

/**
 * Body cho `POST /quizzes/from-ai` — endpoint nhận quiz pre-generated từ Colab.
 *
 * Khác với `/quizzes/ai` (sync gen từ srt_raw_url qua OpenAI), endpoint này
 * KHÔNG gọi LLM — chỉ insert quiz đã có sẵn (LLM-side đã sinh ở Colab) vào DB
 * trong 1 transaction. Dùng cho async flow:
 *   Colab → QStash → media_service webhook → course_service /quizzes/from-ai
 */
export class CreateQuizFromAIDto {
  @IsInt()
  lessonActivityId: number;

  @IsInt()
  videoId: number;

  @IsString()
  name: string;

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

  /** `true` → quiz hiển thị inline trong video tại đúng `evidence.start_ms`. */
  @IsBoolean()
  @IsOptional()
  isInVideo?: boolean;

  /** Optional, để trace từ Colab job nào tạo ra. */
  @IsOptional()
  @IsString()
  jobId?: string;

  /** Optional, lưu metadata model sinh quiz. */
  @IsOptional()
  @IsString()
  model?: string;
}
