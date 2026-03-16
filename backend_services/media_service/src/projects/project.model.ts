import {
    DataType,
    Model,
    Column,
    Table,
    PrimaryKey,
    AutoIncrement,
} from 'sequelize-typescript';

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
    @Column({
        type: DataType.INTEGER,
        allowNull: true,
    })
    highlight_id: number | null;

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


