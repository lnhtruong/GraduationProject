import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { DiscussionPost } from './discussion-post.model';
import { User } from '../users/user.model';

@Table({
  tableName: 'discussion_upvotes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
})
export class DiscussionUpvote extends Model {
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @ForeignKey(() => DiscussionPost)
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
    field: 'post_id',
  })
  declare postId: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'user_id' })
  declare userId: number;

  @BelongsTo(() => DiscussionPost, { foreignKey: 'post_id', constraints: false })
  declare post?: DiscussionPost;
}
