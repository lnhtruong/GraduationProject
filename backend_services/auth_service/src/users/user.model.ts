import { DataType, Model, Column, Table } from 'sequelize-typescript';

@Table({
  tableName: 'users',
  timestamps: true,
})
export class User extends Model {
  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    unique: true,
  })
  declare email: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare password: string | null;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  declare firstName: string | null;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  declare lastName: string | null;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare role: number | null;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
    unique: true,
  })
  declare googleId: string | null;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
    unique: true,
  })
  declare githubId: string | null;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
    unique: true,
  })
  declare facebookId: string | null;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  declare emailVerified: boolean;

  @Column({
    type: DataType.STRING(500),
    allowNull: true,
  })
  declare avatarUrl: string | null;
}
