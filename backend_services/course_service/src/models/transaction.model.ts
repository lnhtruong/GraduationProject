import { Column, DataType, HasMany, Model, Table } from 'sequelize-typescript';
import { TransactionItem } from './transaction-item.model';

export enum TransactionStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
}

@Table({
  tableName: 'transactions',
  timestamps: false,
})
export class PaymentTransaction extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  })
  declare id: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'user_id',
  })
  declare userId: number;

  @Column({
    type: DataType.DOUBLE,
    allowNull: false,
    field: 'total_amount',
  })
  declare totalAmount: number;

  @Column({
    type: DataType.ENUM(...Object.values(TransactionStatus)),
    allowNull: false,
    defaultValue: TransactionStatus.PENDING,
  })
  declare status: TransactionStatus;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    defaultValue: 'payos',
  })
  declare provider: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
    field: 'provider_order_id',
  })
  declare providerOrderId: string | null;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    field: 'created_at',
  })
  declare createdAt: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'paid_at',
  })
  declare paidAt: Date | null;

  @HasMany(() => TransactionItem, {
    foreignKey: 'transaction_id',
    sourceKey: 'id',
    as: 'items',
  })
  declare items?: TransactionItem[];
}
