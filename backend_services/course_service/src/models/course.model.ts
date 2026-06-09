import {
  BelongsTo,
  Column,
  DataType,
  DeletedAt,
  ForeignKey,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import { Video } from './video.model';
import { Lesson } from './lesson.model';
import { User } from 'src/users/user.model';
import { Feedback } from './feedback.model';
import { Enroll } from './enroll.model';
import { HighlightFeed } from './highlight-feed.model';

export enum CourseLevel {
  BEGINNER = 'Beginner',
  INTERMEDIATE = 'Intermediate',
  ADVANCED = 'Advanced',
}

export enum CourseStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PUBLISH = 'publish',
  BANNED = 'banned',
}

@Table({
  tableName: 'courses',
  timestamps: true,
  paranoid: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
})
export class Course extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  })
  declare id: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare name: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare description?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    field: 'thumbnail_url',
  })
  declare thumbnailUrl?: string | null;

  @Column({
    type: DataType.JSON,
    allowNull: false,
  })
  declare categories: unknown;

  @Column({
    type: DataType.ENUM(...Object.values(CourseLevel)),
    allowNull: false,
    defaultValue: CourseLevel.BEGINNER,
  })
  declare level: CourseLevel;

  @Column({
    type: 'TIME(3)' as any,
    allowNull: true,
  })
  declare duration: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare language: string;

  @Column({
    type: DataType.DOUBLE,
    allowNull: false,
  })
  declare price: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'user_id',
  })
  declare userId: number;

  @BelongsTo(() => User, {
    foreignKey: 'userId',
    targetKey: 'id',
    as: 'instructor',
  })
  declare instructor?: User | null;

  @ForeignKey(() => Video)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    field: 'video_id',
  })
  declare videoId: number | null;

  @BelongsTo(() => Video, {
    foreignKey: 'videoId',
    targetKey: 'id',
    as: 'video',
  })
  declare video?: Video | null;

  @Column({
    type: DataType.ENUM(...Object.values(CourseStatus)),
    allowNull: false,
    defaultValue: CourseStatus.DRAFT,
  })
  declare status: CourseStatus;

  @HasMany(() => Lesson, {
    foreignKey: 'course_id',
    sourceKey: 'id',
    as: 'lessons',
  })
  declare lessons?: Lesson[];

  @HasMany(() => Feedback, {
    foreignKey: 'course_id',
    sourceKey: 'id',
    as: 'feedbacks',
  })
  declare feedbacks?: Feedback[];

  @HasMany(() => Enroll, {
    foreignKey: 'course_id',
    sourceKey: 'id',
    as: 'enrolls',
  })
  declare enrolls?: Enroll[];

  @HasMany(() => HighlightFeed, {
    foreignKey: 'course_id',
    sourceKey: 'id',
    as: 'highlightFeeds',
  })
  declare highlightFeeds?: HighlightFeed[];

  // Soft delete (paranoid): `destroy()` set cột này thay vì xoá cứng; mọi query
  // course tự loại trừ row đã xoá.
  @DeletedAt
  @Column({ type: DataType.DATE, allowNull: true, field: 'deleted_at' })
  declare deletedAt: Date | null;
}
