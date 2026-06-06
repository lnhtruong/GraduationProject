import { Table, Column, DataType, Model, Index, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { QuizQuestion } from './quiz-question.model';

@Table({
  tableName: 'quiz_options',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  paranoid: true,
  deletedAt: 'deleted_at',
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
  declare questionId: number;

  @BelongsTo(() => QuizQuestion)
  declare question: QuizQuestion;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    field: 'option_text',
  })
  declare optionText: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_correct',
  })
  declare isCorrect: boolean;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    field: 'order_index',
  })
  declare orderIndex: number;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'deleted_at',
  })
  declare deletedAt: Date | null;
}
