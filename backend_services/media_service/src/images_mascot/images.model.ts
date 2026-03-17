import {
    DataType,
    Model,
    Column,
    Table,
    HasMany,
    PrimaryKey,
    AutoIncrement,
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
    image_id: number;

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

    @HasMany(() => Video)
    videos: Video[];
}
