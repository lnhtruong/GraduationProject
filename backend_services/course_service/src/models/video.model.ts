import { Column, DataType, Model, PrimaryKey, AutoIncrement, Table } from 'sequelize-typescript';

/**
 * Maps to `videos` in shared DB (same as media_service).
 * Used by course_service to read `srt_highlight` for AI quiz generation.
 */
@Table({
  tableName: 'videos',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class Video extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @Column({
    type: DataType.TEXT('long'),
    allowNull: true,
    field: 'srt_highlight',
  })
  declare srt_highlight: string | null;
}
