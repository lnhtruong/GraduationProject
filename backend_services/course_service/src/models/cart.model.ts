import {
  Table,
  Column,
  DataType,
  Model,
  HasMany,
  Index,
} from 'sequelize-typescript';
import { CartItem } from './cart-item.model';

@Table({
  tableName: 'carts',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class Cart extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    unique: true,
    field: 'user_id',
  })
  userId: number;

  @HasMany(() => CartItem, { onDelete: 'CASCADE', hooks: true })
  items: CartItem[];
}
