import { Column, DataType, Model, Table, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { User } from './user.model';
import { HighlightFeed } from './highlight_feed.model';

@Table({
  tableName: 'feed_comments',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class FeedComment extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  })
  declare id: number;

  @ForeignKey(() => HighlightFeed)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare highlight_id: number;

  @BelongsTo(() => HighlightFeed)
  declare highlight: HighlightFeed;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare user_id: number;

  @BelongsTo(() => User)
  declare user: User;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  declare content: string;

  @ForeignKey(() => FeedComment)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare origin_cmt: number | null;

  @BelongsTo(() => FeedComment, {
    foreignKey: 'origin_cmt',
    constraints: false,
  })
  declare origin_comment?: FeedComment;
}