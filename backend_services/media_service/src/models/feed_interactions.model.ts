import { Column, DataType, Model, Table, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { User } from './user.model';
import { HighlightFeed } from './highlight_feed.model';

export enum FeedInteractionType {
  LIKE = 'like',
  SAVE = 'save',
  SHARE = 'share',
}

@Table({
  tableName: 'feed_interactions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
})
export class FeedInteraction extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  })
  declare id: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare user_id: number;

  @BelongsTo(() => User)
  declare user: User;

  @ForeignKey(() => HighlightFeed)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare highlight_id: number;

  @BelongsTo(() => HighlightFeed)
  declare highlight: HighlightFeed;

  @Column({
    type: DataType.ENUM(...Object.values(FeedInteractionType)),
    allowNull: false,
  })
  declare type: FeedInteractionType;
}