import {
  DataType,
  Model,
  Column,
  Table,
  ForeignKey,
  BelongsTo,
  PrimaryKey,
  AutoIncrement,
  Index,
} from 'sequelize-typescript';
import { MascotImage } from 'src/images_mascot/images.model';

export enum VideoType {
  HIGHLIGHT = 'highlight',
  MASCOT = 'mascot',
  /** Bunny Stream: long / course source video */
  LONG = 'long',
}

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

  /** Bunny Stream video GUID; matches webhook `VideoGuid` and TUS `VideoId`. */
  @Index({ unique: true, name: 'uq_videos_bunny_video_guid' })
  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    field: 'bunny_video_guid',
  })
  declare bunny_video_guid: string | null;

  /** Correlates Cloudinary webhooks (video + raw SRT) from one Colab run. */
  @Index({ unique: true, name: 'uq_videos_job_id' })
  @Column({
    type: DataType.STRING(255),
    allowNull: true,
    field: 'job_id',
  })
  declare job_id: string | null;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare user_id: number;

  @ForeignKey(() => MascotImage)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    field: 'mascot_image_id',
  })
  declare image_id: number | null;

  @Column({
    type: DataType.ENUM(...Object.values(VideoType)),
    allowNull: false,
  })
  declare type: VideoType;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare name: string | null;

  /** Video playback URL; may be null until the `video` webhook arrives. */
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare url: string | null;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    defaultValue: 'https://placehold.co/320x180/png?text=thumbnail',
  })
  declare thumbnail: string;

  @Column({
    type: DataType.DOUBLE,
    allowNull: true,
  })
  declare duration: number | null;

  /** URL to the .srt file on Cloudinary (raw upload), not inline transcript text. */
  @Column({
    type: DataType.TEXT,
    allowNull: true,
    field: 'srt_raw_url',
  })
  declare srt_raw_url: string | null;

  @Column({
    type: DataType.JSON,
    allowNull: true,
    field: 'upload_context',
  })
  declare upload_context: Record<string, unknown> | null;

  /** For a highlight video: the `videos.id` of the source video it was generated from. */
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    field: 'original_video_id',
  })
  declare original_video_id: number | null;

  /** Set to an in-flight segment-removal edit job's id; cleared when that job completes/fails. */
  @Column({
    type: DataType.STRING(191),
    allowNull: true,
    field: 'editing_job_id',
  })
  declare editing_job_id: string | null;

  @BelongsTo(() => MascotImage)
  image?: MascotImage;
}
