import { Column, DataType, Model, PrimaryKey, AutoIncrement, Table, Index } from 'sequelize-typescript';

/**
 * Shared `videos` table (same DB as media_service).
 * `srt_raw_url` stores Cloudinary URL to the .srt file; quiz AI fetches text from that URL.
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

  @Index('idx_videos_job_id')
  @Column({
    type: DataType.STRING(255),
    allowNull: true,
    field: 'job_id',
  })
  declare job_id: string | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    field: 'srt_raw_url',
  })
  declare srt_raw_url: string | null;
}
