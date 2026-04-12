import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Cart } from '../models/cart.model';
import { CartItem } from '../models/cart-item.model';
import { Course } from '../models/course.model';
import { CartsService } from './carts.service';
import { CartsController } from './carts.controller';

@Module({
  imports: [SequelizeModule.forFeature([Cart, CartItem, Course])],
  providers: [CartsService],
  controllers: [CartsController],
  exports: [CartsService],
})
export class CartsModule {}
