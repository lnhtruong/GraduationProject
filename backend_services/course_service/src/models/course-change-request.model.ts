import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { Course, CourseLevel } from './course.model';

export enum CourseChangeRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

/**
 * Tập field cấp course được phép gói trong một change request.
 * Đúng các field của UpdateCourseDto sau khi đã normalize (camelCase),
 * nên có thể `course.update(payload)` trực tiếp khi admin approve.
 */
export type CourseUpdatePayload = Partial<{
  name: string;
  description: string | null;
  thumbnailUrl: string | null;
  categories: string[];
  level: CourseLevel;
  language: string;
  price: number;
  videoId: number | null;
}>;

@Table({
  tableName: 'course_change_requests',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class CourseChangeRequest extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  declare id: number;

  @ForeignKey(() => Course)
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'course_id' })
  declare courseId: number;

  @Column({ type: DataType.INTEGER, allowNull: false, field: 'requested_by' })
  declare requestedBy: number;

  @Column({ type: DataType.JSON, allowNull: false })
  declare payload: CourseUpdatePayload;

  @Column({
    type: DataType.ENUM(...Object.values(CourseChangeRequestStatus)),
    allowNull: false,
    defaultValue: CourseChangeRequestStatus.PENDING,
  })
  declare status: CourseChangeRequestStatus;

  @Column({ type: DataType.INTEGER, allowNull: true, field: 'reviewed_by' })
  declare reviewedBy: number | null;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'review_note' })
  declare reviewNote: string | null;

  @BelongsTo(() => Course, { foreignKey: 'course_id', constraints: false })
  declare course?: Course;
}
