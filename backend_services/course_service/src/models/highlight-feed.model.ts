import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { Course } from './course.model';
import { Video } from './video.model';

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
    field: 'video_id',
  })
  declare videoId: number;

  @BelongsTo(() => Video, { foreignKey: 'videoId', targetKey: 'id', as: 'video' })
  declare video?: Video;

  @ForeignKey(() => Course)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'course_id',
  })
  declare courseId: number;

  @BelongsTo(() => Course, { foreignKey: 'courseId', targetKey: 'id', as: 'course' })
  declare course?: Course;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare title: string | null;

  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  declare hashtags: string[] | null;

  @Column({
    type: DataType.ENUM(...Object.values(HighlightFeedStatus)),
    allowNull: false,
    defaultValue: HighlightFeedStatus.HIDDEN,
  })
  declare status: HighlightFeedStatus;
}
