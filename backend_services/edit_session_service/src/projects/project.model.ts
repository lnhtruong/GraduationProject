import {
    DataType,
    Model,
    Column,
    Table,
    PrimaryKey,
    AutoIncrement,
    HasOne,
} from 'sequelize-typescript';
import { MascotOverlay } from 'src/mascot_overlays/mascot_overlay.model';

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

    @Column({
        type: DataType.INTEGER,
        allowNull: true, // nếu DB bạn NOT NULL thì đổi false
    })
    highlight_id: number;

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

    @HasOne(() => MascotOverlay)
    mascotOverlay: MascotOverlay;
}