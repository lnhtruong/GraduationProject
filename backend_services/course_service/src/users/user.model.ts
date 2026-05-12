import { DataType, Model, Column, Table } from 'sequelize-typescript';

@Table({
  tableName: 'users',
  timestamps: true,
})
export class User extends Model {
  // @Column({
  //   type: DataType.INTEGER,
  //   primaryKey: true,
  //   autoIncrement: true,
  //   allowNull: false,
  // })
  // id: number;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    unique: true,
  })
  declare email: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare password: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  declare firstName: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  declare lastName: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare role: number;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_banned',
  })
  declare isBanned: boolean;
}
