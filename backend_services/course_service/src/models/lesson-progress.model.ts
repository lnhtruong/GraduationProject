import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { Course } from './course.model';
import { Lesson } from './lesson.model';

export enum LessonProgressStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  VIDEO_COMPLETE = 'video-completed',
}

@Table({
  tableName: 'lesson_progress',
  timestamps: false,
})
export class LessonProgress extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  })
  declare id: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'user_id',
  })
  declare userId: number;

  @ForeignKey(() => Course)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'course_id',
  })
  declare courseId: number;

  @BelongsTo(() => Course, { constraints: false })
  declare course?: Course;

  @ForeignKey(() => Lesson)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'lesson_id',
  })
  declare lessonId: number;

  @BelongsTo(() => Lesson, { constraints: false })
  declare lesson?: Lesson;

  @Column({
    type: DataType.ENUM(...Object.values(LessonProgressStatus)),
    allowNull: false,
    defaultValue: LessonProgressStatus.NOT_STARTED,
  })
  declare progress: LessonProgressStatus;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'last_video_position_sec',
  })
  declare lastVideoPositionSec: number;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'last_watched_at',
  })
  declare lastWatchedAt: Date | null;
}
