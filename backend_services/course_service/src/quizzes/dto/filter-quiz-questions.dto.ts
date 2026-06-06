import { IsArray, IsInt, ArrayUnique, ArrayMinSize } from 'class-validator';

/**
 * Body cho `PATCH /quizzes/:id/filter-questions` — giảng viên chọn câu nào giữ.
 *
 * Use case:
 *   1. Gọi `/generate-quiz` (qua Colab) sinh 30 câu, insert qua `/quizzes/from-ai`
 *   2. Giảng viên xem 30 câu, đánh dấu 15 câu ưng ý
 *   3. Gọi endpoint này với `keepQuestionIds: [3, 7, 11, ...]` (15 IDs)
 *   4. Backend soft-delete 15 câu còn lại + reindex order_index 1..15
 *
 * Lưu ý: dùng IDs (số nguyên) không dùng index 0-based để tránh nhầm khi
 * client phân trang / sort.
 */
export class FilterQuizQuestionsDto {
  @IsArray()
  @ArrayUnique()
  @ArrayMinSize(1, { message: 'Phải giữ lại ít nhất 1 câu hỏi' })
  @IsInt({ each: true, message: 'keepQuestionIds phải là số nguyên' })
  keepQuestionIds: number[];
}
