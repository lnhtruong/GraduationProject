import { Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { User } from '../users/user.model';

/**
 * Read-only view of the instructor_follows table (owned by user_service).
 * course_service uses it to broadcast "new course" notifications to followers.
 */
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

  @Column({ type: DataType.DATE, allowNull: false, field: 'followed_at' })
  declare followedAt: Date;
}
