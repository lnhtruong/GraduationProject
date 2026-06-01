import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { Course } from './course.model';
import { PaymentTransaction } from './transaction.model';

@Table({
  tableName: 'transaction_items',
  timestamps: false,
})
export class TransactionItem extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  })
  declare id: number;

  @ForeignKey(() => PaymentTransaction)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'transaction_id',
  })
  declare transactionId: number;

  @ForeignKey(() => Course)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'course_id',
  })
  declare courseId: number;

  @Column({
    type: DataType.DOUBLE,
    allowNull: false,
  })
  declare price: number;

  @BelongsTo(() => PaymentTransaction, {
    foreignKey: 'transactionId',
    targetKey: 'id',
    as: 'transaction',
  })
  declare transaction?: PaymentTransaction;

  @BelongsTo(() => Course, {
    foreignKey: 'courseId',
    targetKey: 'id',
    as: 'course',
  })
  declare course?: Course;
}
