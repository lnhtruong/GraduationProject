import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { Course } from './course.model';
import { User } from '../users/user.model';

@Table({
  tableName: 'wishlists',
  timestamps: false,
})
export class Wishlist extends Model {
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'user_id' })
  declare userId: number;

  @ForeignKey(() => Course)
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'course_id' })
  declare courseId: number;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    field: 'added_at',
    defaultValue: DataType.NOW,
  })
  declare addedAt: Date;

  @BelongsTo(() => Course, { foreignKey: 'course_id', constraints: false })
  declare course?: Course;
}
