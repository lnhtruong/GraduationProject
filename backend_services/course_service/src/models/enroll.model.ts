import { Column, DataType, Model, Table } from 'sequelize-typescript';

export enum EnrollStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  DROPPED = 'dropped',
}

@Table({
  tableName: 'enrolls',
  timestamps: false,
})
export class Enroll extends Model {
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

  /** Completion ratio 0–100 (from LessonProgress). */
  @Column({
    type: DataType.DOUBLE,
    allowNull: false,
    defaultValue: 0,
  })
  declare progress: number;

  @Column({
    type: DataType.ENUM(...Object.values(EnrollStatus)),
    allowNull: false,
    defaultValue: EnrollStatus.ACTIVE,
  })
  declare status: EnrollStatus;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    field: 'enrolled_at',
  })
  declare enrolledAt: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'completed_at',
  })
  declare completedAt: Date | null;
}
