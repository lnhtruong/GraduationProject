import { Column, DataType, Model, Table } from 'sequelize-typescript';

export enum CourseLevel {
  BEGINNER = 'Beginner',
  INTERMEDIATE = 'Intermediate',
  ADVANCED = 'Advanced',
}

export enum CourseStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PUBLISH = 'publish',
}

@Table({
  tableName: 'Courses',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class Course extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  })
  declare id: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  name: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  description?: string;

  @Column({
    type: DataType.JSON,
    allowNull: false,
  })
  categories: unknown;

  @Column({
    type: DataType.ENUM(...Object.values(CourseLevel)),
    allowNull: false,
    defaultValue: CourseLevel.BEGINNER,
  })
  level: CourseLevel;

  @Column({
    type: DataType.TIME,
    allowNull: false,
  })
  duration: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  language: string;

  @Column({
    type: DataType.DOUBLE,
    allowNull: false,
  })
  price: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'user_id',
  })
  userId: number;

  @Column({
    type: DataType.ENUM(...Object.values(CourseStatus)),
    allowNull: false,
    defaultValue: CourseStatus.DRAFT,
  })
  status: CourseStatus;
}
