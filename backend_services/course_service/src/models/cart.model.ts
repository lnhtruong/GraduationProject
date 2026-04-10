import {
  Table,
  Column,
  DataType,
  Model,
  HasMany,
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
  declare userId: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'total_quantity',
  })
  declare totalQuantity: number;

  @Column({
    type: DataType.DOUBLE,
    allowNull: false,
    defaultValue: 0,
    field: 'total_amount',
  })
  declare totalAmount: number;

  @HasMany(() => CartItem, { onDelete: 'CASCADE', hooks: true })
  declare items: CartItem[];
}
