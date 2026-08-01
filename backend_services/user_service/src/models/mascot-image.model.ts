import {
  AutoIncrement,
  Column,
  DataType,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';

export enum MascotImageType {
  THUMBNAIL_VIDEO = 'thumbnail_video',
  THUMBNAIL_COURSE = 'thumbnail_course',
  AVT = 'avt',
  REPORT = 'report',
  ROLE_UPGRADE = 'role_upgrade',
}

@Table({ tableName: 'mascot_images', timestamps: true })
export class MascotImage extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare image_id: number;

  @Column({ type: DataType.INTEGER, allowNull: false })
  declare user_id: number;

  @Column({ type: DataType.STRING(255), allowNull: false })
  declare url: string;

  @Column({ type: DataType.STRING(255), allowNull: true })
  declare name: string | null;

  @Column({ type: DataType.STRING(32), allowNull: true })
  declare format: string | null;

  @Column({
    type: DataType.ENUM(...Object.values(MascotImageType)),
    allowNull: false,
    defaultValue: MascotImageType.THUMBNAIL_VIDEO,
  })
  declare type: MascotImageType;
}
