import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { User } from '../users/user.model';

export enum LecturerRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Table({
  tableName: 'lecturer_upgrade_requests',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class LecturerUpgradeRequest extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'user_id',
  })
  declare userId: number;

  @BelongsTo(() => User, { foreignKey: 'userId', as: 'requester' })
  declare requester?: User;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare confirm: string | null;

  @Column({
    type: DataType.JSON,
    allowNull: true,
    field: 'evidence_image_ids',
  })
  declare evidenceImageIds: number[] | null;

  @Column({
    type: DataType.ENUM(...Object.values(LecturerRequestStatus)),
    allowNull: false,
    defaultValue: LecturerRequestStatus.PENDING,
  })
  declare status: LecturerRequestStatus;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    field: 'reviewer_id',
  })
  declare reviewerId: number | null;

  @BelongsTo(() => User, { foreignKey: 'reviewerId', as: 'reviewer' })
  declare reviewer?: User;

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
}
