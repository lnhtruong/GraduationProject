import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import databaseConfig from '../config/database.config';
import { User } from '../users/user.model';
import { Video } from '../models/video.model';
import { Cart } from '../models/cart.model';
import { CartItem } from '../models/cart-item.model';
import { Course } from '../models/course.model';

@Module({
  imports: [
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const dbConfig = configService.get('database');
        return {
          ...dbConfig,
          models: [User, Video, Cart, CartItem, Course],
          autoLoadModels: true,
          synchronize: true, // Set to true to create new tables (carts, cart_items)
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule { }
