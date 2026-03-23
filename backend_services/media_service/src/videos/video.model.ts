import {
  DataType,
  Model,
  Column,
  Table,
  ForeignKey,
  BelongsTo,
  PrimaryKey,
  AutoIncrement,
} from 'sequelize-typescript';
import { MascotImage } from 'src/images_mascot/images.model';

export enum VideoType {
  HIGHLIGHT = 'highlight',
  MASCOT = 'mascot',
}

@Table({
  tableName: 'videos',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class Video extends Model {
  // @PrimaryKey
  // @AutoIncrement
  // @Column(DataType.INTEGER)
  // id: number;

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
    type: DataType.TEXT,
    allowNull: false,
  })
  declare url: string;

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

  @BelongsTo(() => MascotImage)
  image?: MascotImage;
}


