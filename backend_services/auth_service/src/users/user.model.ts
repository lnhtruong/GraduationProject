import {
  DataType,
  Model,
  Column,
  Table,
} from 'sequelize-typescript';

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
  email: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  password: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  firstName: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  lastName: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  role: number;
}
