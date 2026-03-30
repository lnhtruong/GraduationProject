import {
    DataType,
    Model,
    Column,
    Table,
    PrimaryKey,
    AutoIncrement,
    ForeignKey,
    BelongsTo,
} from 'sequelize-typescript';
import { Video } from 'src/videos/video.model';
import { Project } from 'src/projects/project.model';
import { MascotImage } from 'src/images_mascot/images.model';

@Table({
    tableName: 'mascot_overlays',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
})
export class MascotOverlay extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    declare mascot_overlay_id: number;

    @ForeignKey(() => Project)
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    edit_id: number;

    @ForeignKey(() => MascotImage)
    @Column({
        type: DataType.INTEGER,
        allowNull: true,
    })
    image_id: number;

    // FK logic: videos.id where videos.type = 'mascot'
    // @ForeignKey(() => Video)
    // @Column({
    //     type: DataType.INTEGER,
    //     allowNull: false,
    //     unique: true,
    // })
    // mascot_video_id: number;

    @Column({
        type: DataType.FLOAT,
        allowNull: false,
    })
    position_x: number;

    @Column({
        type: DataType.FLOAT,
        allowNull: false,
    })
    position_y: number;

    @Column({
        type: DataType.FLOAT,
        allowNull: false,
    })
    scale: number;

    @Column({
        type: DataType.FLOAT,
        allowNull: false,
    })
    start_time: number;

    @Column({
        type: DataType.FLOAT,
        allowNull: false,
    })
    end_time: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    layer_index: number;

    // @BelongsTo(() => Video)
    // mascotVideo: Video;

    @BelongsTo(() => Project)
    edit: Project;

    @BelongsTo(() => MascotImage)
    declare mascotImage: MascotImage;
}


