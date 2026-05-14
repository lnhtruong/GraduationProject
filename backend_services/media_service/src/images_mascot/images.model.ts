import {
    DataType,
    Model,
    Column,
    Table,
    HasMany,
    PrimaryKey,
    AutoIncrement,
    Index,
} from 'sequelize-typescript';
// import { Optional } from 'sequelize';
import { Video } from 'src/videos/video.model';
// import { MascotVideo } from '../images_mascot/images.model';

@Table({
    tableName: 'mascot_images',
    timestamps: true,
})
export class MascotImage extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    declare image_id: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    user_id: number;

    @Column({
        type: DataType.STRING(255),
        allowNull: false,
    })
    url: string;

    /** Same id as Colab / client session when image is part of a multi-step flow (optional). */
    @Index({ unique: true, name: 'uq_mascot_images_job_id' })
    @Column({ type: DataType.STRING(64), allowNull: true })
    declare job_id: string | null;

    @Column({ type: DataType.STRING(1024), allowNull: true })
    declare thumbnail: string | null;

    @Column({ type: DataType.STRING(512), allowNull: true })
    declare public_id: string | null;

    @Column({ type: DataType.STRING(32), allowNull: true })
    declare format: string | null;

    @Column({ type: DataType.STRING(255), allowNull: true })
    declare name: string | null;

    @HasMany(() => Video)
    videos: Video[];
}

/** Alias for webhook / upload flows that treat rows as generic images. */
export { MascotImage as Image };
