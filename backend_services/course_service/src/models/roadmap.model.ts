import { Column, DataType, HasMany, Model, Table } from 'sequelize-typescript';
import { RoadMapCourse } from './roadmap-course.model';

@Table({
  tableName: 'RoadMaps',
  timestamps: false,
})
export class RoadMap extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  })
  declare id: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    field: 'user_id',
  })
  declare userId?: number | null;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare description?: string | null;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare name: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    field: 'total_courses',
    defaultValue: 0,
  })
  declare totalCourses?: number | null;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    defaultValue: 0,
  })
  declare progress?: number | null;

  @HasMany(() => RoadMapCourse)
  declare roadmapCourses?: RoadMapCourse[];
}