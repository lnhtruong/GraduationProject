import {
  Table,
  Column,
  DataType,
  Model,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Cart } from './cart.model';
import { Course } from './course.model';

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
  declare cartId: number;

  @BelongsTo(() => Cart)
  declare cart: Cart;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'course_id',
  })
  declare courseId: number;

  @BelongsTo(() => Course, { foreignKey: 'courseId', targetKey: 'id' })
  declare course?: Course;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'saved_for_later',
  })
  declare savedForLater: boolean;
}
