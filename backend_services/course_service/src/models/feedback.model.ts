import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import { Course } from './course.model';
import { User } from 'src/users/user.model';
import { FeedbackReaction } from './feedback-reaction.model';

@Table({
  tableName: 'feedbacks',
  timestamps: true,
  paranoid: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
})
export class Feedback extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @ForeignKey(() => Course)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'course_id',
  })
  declare courseId: number;

  @BelongsTo(() => Course)
  declare course: Course;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'user_id',
  })
  declare userId: number;

  @BelongsTo(() => User)
  declare user: User;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare rating: number;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    field: 'review_text',
  })
  declare reviewText: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'is_visible',
  })
  declare isVisible: boolean;

  @HasMany(() => FeedbackReaction, { onDelete: 'CASCADE', hooks: true })
  declare reactions: FeedbackReaction[];
}
