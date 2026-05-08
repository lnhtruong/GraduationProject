import { Column, DataType, Model, Table, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Video } from '../videos/video.model';
import { Course } from './course.model';

export enum HighlightFeedStatus {
  ACTIVE = 'active',
  HIDDEN = 'hidden',
  REMOVED = 'removed',
}

@Table({
  tableName: 'highlight_feed',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class HighlightFeed extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  })
  declare id: number;

  @ForeignKey(() => Video)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare video_id: number;

  @BelongsTo(() => Video)
  declare video: Video;

  @ForeignKey(() => Course)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare course_id: number;

  @BelongsTo(() => Course)
  declare course: Course;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare title?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare caption?: string | null;

  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  declare hashtags?: string[];

  @Column({
    type: DataType.ENUM(...Object.values(HighlightFeedStatus)),
    allowNull: false,
    defaultValue: HighlightFeedStatus.ACTIVE,
  })
  declare status: HighlightFeedStatus;
}