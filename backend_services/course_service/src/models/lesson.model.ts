// src/models/lessons/models/lesson.model.ts
import { Column, DataType, Model, Table, Index } from 'sequelize-typescript';
// import { ContentType, LessonStatus } from '../enums/lesson.enum';

// src/models/lessons/enums/lesson.enum.ts

export enum LessonStatus {
  ACTIVE = 'active',
  REMOVED = 'removed',
  BLOCKED = 'blocked',
}

export enum ContentType {
  VIDEO = 'video',
  TEXT = 'text',
  QUIZ = 'quiz', // Thêm bớt tuỳ theo yêu cầu hệ thống của bạn
}

@Table({
  tableName: 'lessons',
  timestamps: true,
  createdAt: 'created_at', // Map đúng với tên cột trong DB của bạn
  updatedAt: 'updated_at',
})
export class Lesson extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;

  @Index('idx_lessons_course_id')
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    field: 'course_id',
  })
  courseId: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  title: string;

  @Column({
    type: DataType.ENUM(...Object.values(ContentType)),
    allowNull: false,
  })
  contentType: ContentType;

  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  content: Record<string, any>;

  @Column({
    type: DataType.FLOAT,
    allowNull: true,
  })
  duration: number;

  @Column({
    type: DataType.ENUM(...Object.values(LessonStatus)),
    defaultValue: LessonStatus.ACTIVE,
  })
  status: LessonStatus;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  description: string;
}