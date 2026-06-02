import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Course } from 'src/models/course.model';
import { TransactionItem } from 'src/models/transaction-item.model';
import { PaymentTransaction } from 'src/models/transaction.model';
import { InstructorRevenueController } from './instructor-revenue.controller';
import { InstructorRevenueService } from './instructor-revenue.service';

@Module({
  imports: [
    SequelizeModule.forFeature([Course, PaymentTransaction, TransactionItem]),
  ],
  controllers: [InstructorRevenueController],
  providers: [InstructorRevenueService],
})
export class InstructorRevenueModule {}
