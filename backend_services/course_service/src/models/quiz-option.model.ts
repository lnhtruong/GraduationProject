import { Table, Column, DataType, Model, Index, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { QuizQuestion } from './quiz-question.model';

@Table({
  tableName: 'quiz_options',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class QuizOption extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @Index('idx_quiz_options_question_id')
  @ForeignKey(() => QuizQuestion)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'question_id',
  })
  questionId: number;

  @BelongsTo(() => QuizQuestion)
  question: QuizQuestion;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    field: 'option_text',
  })
  optionText: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_correct',
  })
  isCorrect: boolean;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    field: 'order_index',
  })
  orderIndex: number;
}
