import {
    AutoIncrement,
    BelongsTo,
    Column,
    DataType,
    ForeignKey,
    Model,
    PrimaryKey,
    Table,
} from 'sequelize-typescript';

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
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    id: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    user_id: number;

    @Column({
        type: DataType.ENUM(...Object.values(VideoType)),
        allowNull: false,
    })
    type: VideoType;

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    name: string | null;

    @Column({
        type: DataType.TEXT,
        allowNull: false,
    })
    url: string;

    @Column({
        type: DataType.DOUBLE,
        allowNull: true,
    })
    duration: number | null;
}


