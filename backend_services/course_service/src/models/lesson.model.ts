// src/models/lessons/models/lesson.model.ts
import { BelongsTo, Column, DataType, ForeignKey, Model, Table, Index } from 'sequelize-typescript';
import { Video } from './video.model';
// import { ContentType, LessonStatus } from '../enums/lesson.enum';

// src/models/lessons/enums/lesson.enum.ts

export enum LessonStatus {
  ACTIVE = 'active',
  REMOVED = 'removed',
  BLOCKED = 'blocked',
}

export enum ContentType {
  VIDEO = 'video',
  TEXT = 'text',
}

@Table({
  tableName: 'lessons',
  timestamps: true,
  createdAt: 'created_at', // Map đúng với tên cột trong DB của bạn
  updatedAt: 'updated_at',
})
export class Lesson extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @Index('idx_lessons_course_id')
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    field: 'course_id',
  })
  declare courseId: number;

  @Index('idx_lessons_video_id')
  @ForeignKey(() => Video)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    field: 'video_id',
  })
  declare videoId: number | null;

  @BelongsTo(() => Video, { foreignKey: 'video_id', constraints: false })
  declare video?: Video;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare title: string;

  @Column({
    type: DataType.ENUM(...Object.values(ContentType)),
    allowNull: false,
  })
  declare contentType: ContentType;

  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  declare content: Record<string, any>;

  @Column({
    type: 'TIME(3)' as any,
    allowNull: true,
  })
  declare duration: string | null;

  @Column({
    type: DataType.ENUM(...Object.values(LessonStatus)),
    defaultValue: LessonStatus.ACTIVE,
  })
  declare status: LessonStatus;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare description: string;
}