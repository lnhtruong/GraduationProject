import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { User } from '../users/user.model';

@Table({
  tableName: 'instructor_follows',
  timestamps: false,
})
export class InstructorFollow extends Model {
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'follower_id' })
  declare followerId: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'instructor_id' })
  declare instructorId: number;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    field: 'followed_at',
    defaultValue: DataType.NOW,
  })
  declare followedAt: Date;

  @BelongsTo(() => User, { foreignKey: 'follower_id', as: 'follower', constraints: false })
  declare follower?: User;

  @BelongsTo(() => User, { foreignKey: 'instructor_id', as: 'instructor', constraints: false })
  declare instructor?: User;
}
