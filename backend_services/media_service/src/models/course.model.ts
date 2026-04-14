import { Column, DataType, Model, Table, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { User } from './user.model';

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
  tableName: 'courses',
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
  declare name: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare description?: string;

  @Column({
    type: DataType.JSON,
    allowNull: false,
  })
  declare categories: unknown;

  @Column({
    type: DataType.ENUM(...Object.values(CourseLevel)),
    allowNull: false,
    defaultValue: CourseLevel.BEGINNER,
  })
  declare level: CourseLevel;

  @Column({
    type: DataType.TIME,
    allowNull: false,
  })
  declare duration: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare language: string;

  @Column({
    type: DataType.DOUBLE,
    allowNull: false,
  })
  declare price: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'user_id',
  })
  declare userId: number;

  @BelongsTo(() => User)
  declare user: User;

  @Column({
    type: DataType.ENUM(...Object.values(CourseStatus)),
    allowNull: false,
  })
  declare status: CourseStatus;
}