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
import { MascotVideo } from 'src/mascot_overlays/video_mascot.model';
import { Project } from 'src/projects/project.model';
// import { Edit } from 'src/edits/edit.model'; // sửa lại path nếu khác

@Table({
    tableName: 'mascot_overlays',
    timestamps: true,
})
export class MascotOverlay extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    mascot_overlay_id: number;

    @ForeignKey(() => Project)
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        unique: true, // 1-1 relationship: một project chỉ có 1 overlay
    })
    edit_id: number;

    @ForeignKey(() => MascotVideo)
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        unique: true, // 1-1 relationship: một mascot video chỉ có 1 overlay
    })
    mascot_video_id: number;

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

    @BelongsTo(() => MascotVideo)
    mascotVideo: MascotVideo;

    @BelongsTo(() => Project)
    edit: Project;
}