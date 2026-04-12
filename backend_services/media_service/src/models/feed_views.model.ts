import { Column, DataType, Model, Table, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { User } from './user.model';
import { HighlightFeed } from './highlight_feed.model';

@Table({
  tableName: 'feed_views',
  timestamps: true,
  createdAt: 'viewed_at',
  updatedAt: false,
})
export class FeedView extends Model {
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
    type: DataType.FLOAT,
    allowNull: true,
  })
  declare watch_duration?: number;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  declare completed: boolean;
}