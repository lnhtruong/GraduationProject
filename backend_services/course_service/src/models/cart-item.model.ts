import {
  Table,
  Column,
  DataType,
  Model,
  ForeignKey,
  BelongsTo,
  Index,
} from 'sequelize-typescript';
import { Cart } from './cart.model';

@Table({
  tableName: 'cart_items',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class CartItem extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @ForeignKey(() => Cart)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'cart_id',
  })
  cartId: number;

  @BelongsTo(() => Cart)
  cart: Cart;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'course_id',
  })
  courseId: number;
}
