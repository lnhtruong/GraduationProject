import { IsArray, IsInt, ArrayMinSize, ArrayUnique } from 'class-validator';

/**
 * Body cho `POST /quizzes/:id/restore-questions` — undo soft-delete.
 * Khôi phục các câu hỏi đã bị xóa mềm trở lại quiz, không tự reindex
 * (giảng viên phải gọi `/filter-questions` lại nếu muốn re-order).
 */
export class RestoreQuizQuestionsDto {
  @IsArray()
  @ArrayUnique()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  questionIds: number[];
}
