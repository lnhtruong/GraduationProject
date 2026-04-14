import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { Course } from './course.model';
import { RoadMap } from './roadmap.model';

export enum RoadMapCourseStatus {
  NULL = 'null',
  LEARNING = 'learning',
  FINISH = 'finish',
}

@Table({
  tableName: 'roadmap_course',
  timestamps: false,
})
export class RoadMapCourse extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  })
  declare id: number;

  @ForeignKey(() => Course)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    field: 'course_id',
  })
  declare courseId?: number | null;

  @BelongsTo(() => Course)
  declare course?: Course;

  @ForeignKey(() => RoadMap)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    field: 'roadmap_id',
  })
  declare roadmapId?: number | null;

  @BelongsTo(() => RoadMap)
  declare roadmap?: RoadMap;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    field: 'index',
  })
  declare orderIndex?: number | null;

  @Column({
    type: DataType.ENUM(...Object.values(RoadMapCourseStatus)),
    allowNull: true,
    defaultValue: null,
  })
  declare status?: RoadMapCourseStatus | null;
}