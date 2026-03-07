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
// import { MascotImage } from '../video_mascots/video_mascot.model';

@Table({
    tableName: 'mascot_videos',
    timestamps: true,
})
export class MascotVideo extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    mascot_video_id: number;

    @ForeignKey(() => MascotImage)
    @Column({
        type: DataType.INTEGER,
        allowNull: true,
    })
    image_id: number;

    @Column({
        type: DataType.STRING(255),
        allowNull: false,
    })
    url: string;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    duration: number;

    @BelongsTo(() => MascotImage)
    image: MascotImage;
}
