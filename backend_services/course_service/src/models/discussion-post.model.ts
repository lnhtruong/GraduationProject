import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import { Lesson } from './lesson.model';
import { User } from '../users/user.model';

@Table({
  tableName: 'discussion_posts',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class DiscussionPost extends Model {
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @ForeignKey(() => Lesson)
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'lesson_id' })
  declare lessonId: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'user_id' })
  declare userId: number;

  @ForeignKey(() => DiscussionPost)
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: true,
    field: 'parent_id',
  })
  declare parentId: number | null;

  @Column({ type: DataType.TEXT, allowNull: false })
  declare content: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_best_answer',
  })
  declare isBestAnswer: boolean;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  declare upvotes: number;

  @BelongsTo(() => Lesson, { foreignKey: 'lesson_id', constraints: false })
  declare lesson?: Lesson;

  @BelongsTo(() => User, { foreignKey: 'user_id', constraints: false })
  declare author?: User;

  @BelongsTo(() => DiscussionPost, {
    foreignKey: 'parent_id',
    as: 'parent',
    constraints: false,
  })
  declare parent?: DiscussionPost;

  @HasMany(() => DiscussionPost, {
    foreignKey: 'parent_id',
    as: 'replies',
    constraints: false,
  })
  declare replies?: DiscussionPost[];
}
