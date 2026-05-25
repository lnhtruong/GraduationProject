import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { User } from 'src/users/user.model';

export enum ReportTargetType {
  TEACHER = 'teacher',
  COURSE = 'course',
  LESSON = 'lesson',
}

export enum ReportStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Table({
  tableName: 'reports',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  paranoid: true,
  deletedAt: 'deleted_at',
})
export class Report extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @Column({
    type: DataType.ENUM(...Object.values(ReportTargetType)),
    allowNull: false,
    field: 'target_type',
  })
  declare targetType: ReportTargetType;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'target_id',
  })
  declare targetId: number;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  declare reason: string;

  @Column({
    type: DataType.ENUM(...Object.values(ReportStatus)),
    allowNull: false,
    defaultValue: ReportStatus.PENDING,
  })
  declare status: ReportStatus;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'reporter_id',
  })
  declare reporterId: number;

  @BelongsTo(() => User, { foreignKey: 'reporterId', as: 'reporter' })
  declare reporter?: User;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    field: 'approver_id',
  })
  declare approverId: number | null;

  @BelongsTo(() => User, { foreignKey: 'approverId', as: 'approver' })
  declare approver?: User;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    field: 'review_note',
  })
  declare reviewNote: string | null;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'reviewed_at',
  })
  declare reviewedAt: Date | null;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'deleted_at',
  })
  declare deletedAt: Date | null;
}
