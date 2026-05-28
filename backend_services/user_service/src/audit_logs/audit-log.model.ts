import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({
  tableName: 'audit_logs',
  timestamps: false,
})
export class AuditLog extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'actor_user_id',
  })
  declare actorUserId: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'actor_role',
  })
  declare actorRole: number;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  declare action: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
    field: 'target_type',
  })
  declare targetType: string | null;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    field: 'target_id',
  })
  declare targetId: number | null;

  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  declare before: Record<string, unknown> | null;

  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  declare after: Record<string, unknown> | null;

  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  declare metadata: Record<string, unknown> | null;

  @Column({
    type: DataType.STRING(45),
    allowNull: true,
  })
  declare ip: string | null;

  @Column({
    type: DataType.STRING(512),
    allowNull: true,
    field: 'user_agent',
  })
  declare userAgent: string | null;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
    field: 'created_at',
  })
  declare createdAt: Date;
}
