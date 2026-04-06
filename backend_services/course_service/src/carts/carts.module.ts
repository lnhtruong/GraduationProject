import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Cart } from '../models/cart.model';
import { CartItem } from '../models/cart-item.model';
import { CartsService } from './carts.service';
import { CartsController } from './carts.controller';

@Module({
  imports: [SequelizeModule.forFeature([Cart, CartItem])],
  providers: [CartsService],
  controllers: [CartsController],
  exports: [CartsService],
})
export class CartsModule {}
