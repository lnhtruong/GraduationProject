import { Column, DataType, Model, Table } from 'sequelize-typescript';

export const DISCUSSION_REPLY_EVENT = 'discussion.reply.created';
export const DISCUSSION_POST_SOURCE = 'discussion_post';
export const COURSE_PUBLISH_EVENT = 'course.publish.new_from_instructor';
export const COURSE_SOURCE = 'course';

/** Gửi cho giảng viên khi change request của họ được admin duyệt. */
export const COURSE_CHANGE_APPROVED_EVENT = 'course.change_request.approved';
/** Gửi cho giảng viên khi change request của họ bị admin từ chối. */
export const COURSE_CHANGE_REJECTED_EVENT = 'course.change_request.rejected';
/** Gửi cho học viên đã enroll khi nội dung khóa học được cập nhật (sau approve). */
export const COURSE_UPDATED_EVENT = 'course.updated';

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

  @Column({ type: DataType.INTEGER, allowNull: false, field: 'user_id' })
  declare userId: number;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    field: 'event_type',
  })
  declare eventType: string;

  @Column({ type: DataType.STRING(255), allowNull: false })
  declare title: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare message: string | null;

  @Column({ type: DataType.JSON, allowNull: true })
  declare payload: Record<string, unknown> | null;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_read',
  })
  declare isRead: boolean;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
    field: 'source_type',
  })
  declare sourceType: string | null;

  @Column({ type: DataType.INTEGER, allowNull: true, field: 'source_id' })
  declare sourceId: number | null;
}
