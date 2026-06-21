// src/models/lesson-activities/models/lesson-activity.model.ts
import { Column, DataType, HasMany, Model, Table, Index } from 'sequelize-typescript';
import { Quiz } from './quiz.model';
// import { ActivityStatus, ActivityType } from '../enums/lesson-activity.enum';

export enum ActivityStatus {
  DRAFT = 'draft',
  PUBLIC = 'public',
  ARCHIVED = 'archived',
  REMOVED = 'removed',
}

export enum ActivityType {
  QUIZ = 'quiz',
  ASSIGNMENT = 'assignment',
}

@Table({
  tableName: 'lesson_activities',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class LessonActivity extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @Index('idx_lesson_activities_lesson_id')
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    field: 'lesson_id',
  })
  declare lessonId: number;

  @Column({
    type: DataType.ENUM(...Object.values(ActivityType)),
    allowNull: true,
    field: 'activity_type',
  })
  declare activityType: ActivityType;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare title: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare description: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    field: 'order_index',
  })
  declare orderIndex: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    field: 'max_attempts',
  })
  declare maxAttempts: number;

  @Column({
    type: DataType.ENUM(...Object.values(ActivityStatus)),
    // PUBLIC khi tạo: activity (quiz container/assignment) trở thành submittable
    // ngay khi course publish. Không có luồng nào promote draft->public, và listing
    // đã hiển thị cả draft (chỉ ẩn removed), nên draft chỉ chặn nộp quiz một cách
    // ngoài ý muốn. Gate thực sự cho học viên vẫn là course.status=publish + enrollment.
    defaultValue: ActivityStatus.PUBLIC,
  })
  declare status: ActivityStatus;

  @Index('idx_lesson_activities_created_by')
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    field: 'created_by',
  })
  declare createdBy: number;

  @HasMany(() => Quiz, { foreignKey: 'lesson_activity_id', sourceKey: 'id', as: 'quizzes' })
  declare quizzes?: Quiz[];
}