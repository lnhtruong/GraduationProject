import { BelongsTo, Column, DataType, ForeignKey, HasMany, Model, Table } from 'sequelize-typescript';
import { Video } from './video.model';
import { Lesson } from './lesson.model';

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
  createdAt: 'created_at',
  updatedAt: 'updated_at',
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

  @HasMany(() => Lesson, { foreignKey: 'course_id', sourceKey: 'id', as: 'lessons' })
  declare lessons?: Lesson[];
}
