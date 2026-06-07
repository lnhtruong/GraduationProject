import {
  Table,
  Column,
  DataType,
  Model,
  Index,
  ForeignKey,
  BelongsTo,
  HasMany,
} from 'sequelize-typescript';
import { Quiz } from './quiz.model';
import { QuizOption } from './quiz-option.model';


export enum QuestionType {
  SHORT_TEXT = 'short_text',
  MULTIPLE_CHOICE = 'mcq',
  TF = 'true/false',
}

@Table({
  tableName: 'quiz_questions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  paranoid: true,
  deletedAt: 'deleted_at',
})
export class QuizQuestion extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @Index('idx_quiz_questions_quiz_id')
  @ForeignKey(() => Quiz)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'quiz_id',
  })
  declare quizId: number;

  @BelongsTo(() => Quiz)
  declare quiz: Quiz;

  @Column({
    type: DataType.ENUM(...Object.values(QuestionType)),
    allowNull: false,
    field: 'ques_type',
  })
  declare quesType: QuestionType;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    field: 'ques_text',
  })
  declare quesText: string;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: true,
  })
  declare point: number;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    field: 'correct_ans',
  })
  declare correctAns: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    field: 'order_index',
  })
  declare orderIndex: number;

  @Column({
    type: 'TIME(3)' as any,
    allowNull: true,
    field: 'video_timestamp',
  })
  declare videoTimestamp: string | null;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'deleted_at',
  })
  declare deletedAt: Date | null;

  // @HasMany(() => require('./quiz-option.model').QuizOption, { onDelete: 'CASCADE', hooks: true })
  // options: import('./quiz-option.model').QuizOption[];
  @HasMany(() => QuizOption, { onDelete: 'CASCADE', hooks: true })
  declare options: QuizOption[];
}
