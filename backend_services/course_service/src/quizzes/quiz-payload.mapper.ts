import { QuestionType } from 'src/models/quiz-question.model';
import type { QuizQuestion as GenQuizQuestion } from './helper/quiz.gen';

/**
 * Maps generator output (`true_false`) to DB enum (`true/false`).
 */
export function mapGeneratedQuestionType(quesType: string): QuestionType {
  if (quesType === 'short_text') return QuestionType.SHORT_TEXT;
  if (quesType === 'true_false') return QuestionType.TF;
  return QuestionType.MULTIPLE_CHOICE;
}

export function toPersistableQuestionRow(q: GenQuizQuestion) {
  return {
    quesType: mapGeneratedQuestionType(q.quesType),
    quesText: q.quesText,
    point: q.point,
    correctAns: q.correctExplanation ?? null,
    orderIndex: q.orderIndex,
    options: (q.options ?? []).map((o) => ({
      optionText: o.optionText,
      isCorrect: o.isCorrect,
      orderIndex: o.orderIndex,
    })),
  };
}
