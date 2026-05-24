import {
  Table,
  Column,
  DataType,
  Model,
  Index,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Quiz } from './quiz.model';
import { QuizSubmissionAnswerSnapshot } from 'src/quiz-submissions/quiz-submission.types';

export type { QuizSubmissionAnswerSnapshot };

@Table({
  tableName: 'quiz_submissions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class QuizSubmission extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @Index('idx_quiz_submissions_quiz_id')
  @ForeignKey(() => Quiz)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'quiz_id',
  })
  quizId: number;

  @BelongsTo(() => Quiz)
  quiz: Quiz;

  @Index('idx_quiz_submissions_user_id')
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'user_id',
  })
  userId: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: true,
  })
  score: number | null;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: true,
    field: 'max_score',
  })
  maxScore: number | null;

  @Column({
    type: DataType.DECIMAL(5, 2),
    allowNull: true,
  })
  percent: number | null;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  passed: boolean;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    field: 'time_spent_seconds',
  })
  timeSpentSeconds: number | null;

  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  answers: QuizSubmissionAnswerSnapshot[] | null;
}
