import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Course } from 'src/models/course.model';
import { TransactionItem } from 'src/models/transaction-item.model';
import { PaymentTransaction } from 'src/models/transaction.model';
import { User } from 'src/users/user.model';
import { AdminRevenueController } from './admin-revenue.controller';
import { AdminRevenueService } from './admin-revenue.service';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Course,
      PaymentTransaction,
      TransactionItem,
      User,
    ]),
  ],
  controllers: [AdminRevenueController],
  providers: [AdminRevenueService],
})
export class AdminRevenueModule {}
