import { Column, DataType, Model, Table } from 'sequelize-typescript';

export enum LessonProgressStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
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

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'course_id',
  })
  declare courseId: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'lesson_id',
  })
  declare lessonId: number;

  @Column({
    type: DataType.ENUM(...Object.values(LessonProgressStatus)),
    allowNull: false,
    defaultValue: LessonProgressStatus.NOT_STARTED,
  })
  declare progress: LessonProgressStatus;
}
