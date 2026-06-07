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
import { LessonActivity } from './lesson-activity.model';
import { QuizQuestion } from './quiz-question.model';

@Table({
  tableName: 'quizzes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  paranoid: true,
  deletedAt: 'deleted_at',
})
export class Quiz extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @Index('idx_quizzes_lesson_activity_id')
  @ForeignKey(() => LessonActivity)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'lesson_activity_id',
  })
  declare lessonActivityId: number;

  @BelongsTo(() => LessonActivity)
  declare lessonActivity: LessonActivity;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare name: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'shuffle_question',
  })
  declare shuffleQuestion: boolean;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'shuffle_option',
  })
  declare shuffleOption: boolean;

  @Column({
    type: DataType.DOUBLE,
    allowNull: true,
    field: 'passing_score',
  })
  declare passingScore: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    field: 'time_limit_minutes',
  })
  declare timeLimitMinutes: number;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_in_video',
  })
  declare isInVideo: boolean;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'deleted_at',
  })
  declare deletedAt: Date | null;

  // @HasMany(() => require('./quiz-question.model').QuizQuestion, { onDelete: 'CASCADE', hooks: true })
  // questions: import('./quiz-question.model').QuizQuestion[];
  @HasMany(() => QuizQuestion, { onDelete: 'CASCADE', hooks: true })
  declare questions: QuizQuestion[];
}
