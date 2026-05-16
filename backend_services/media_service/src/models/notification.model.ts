import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { User } from './user.model';
import type { NotificationEventType, NotificationSourceType } from '../notifications/notification.enums';
import {
  NOTIFICATION_EVENT_TYPE_MYSQL_ENUM,
  NOTIFICATION_SOURCE_TYPE_MYSQL_ENUM,
} from '../notifications/notification.enums';

/** Domain + MySQL ENUM — lists in `../notifications/notification.enums.ts` / knex `021_*`. */

@Table({
  tableName: 'notifications',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class Notification extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  })
  declare id: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare user_id: number;

  @BelongsTo(() => User)
  declare user: User;

  @Column({
    type: DataType.ENUM(...NOTIFICATION_EVENT_TYPE_MYSQL_ENUM),
    allowNull: false,
  })
  declare event_type: NotificationEventType;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare title: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare message: string | null;

  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  declare payload: Record<string, unknown> | null;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  declare is_read: boolean;

  @Column({
    type: DataType.ENUM(...NOTIFICATION_SOURCE_TYPE_MYSQL_ENUM),
    allowNull: true,
  })
  declare source_type: NotificationSourceType | null;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare source_id: number | null;
}
