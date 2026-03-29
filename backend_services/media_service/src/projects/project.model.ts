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

export enum ProjectStatus {
    DRAFT = 'draft',
    SAVED = 'saved',
    FINALIZED = 'finalized',
}

@Table({
    tableName: 'projects',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
})
export class Project extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    edit_id: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    user_id: number;

    // FK logic: videos.id where videos.type = 'highlight'
    @ForeignKey(() => Video)
    @Column({
        type: DataType.INTEGER,
        allowNull: true,
    })
    video_id: number | null;

    @BelongsTo(() => Video, { foreignKey: 'video_id', targetKey: 'id' })
    video?: Video;

    @Column({
        type: DataType.ENUM(...Object.values(ProjectStatus)),
        allowNull: false,
        defaultValue: ProjectStatus.DRAFT,
    })
    status: ProjectStatus;

    @Column({
        type: DataType.STRING(255),
        allowNull: false,
    })
    session_name: string;
}


