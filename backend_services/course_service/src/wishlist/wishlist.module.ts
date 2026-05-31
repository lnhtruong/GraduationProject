import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Wishlist } from '../models/wishlist.model';
import { Course } from '../models/course.model';
import { User } from '../users/user.model';
import { WishlistController } from './wishlist.controller';
import { WishlistService } from './wishlist.service';

@Module({
  imports: [SequelizeModule.forFeature([Wishlist, Course, User])],
  controllers: [WishlistController],
  providers: [WishlistService],
  exports: [WishlistService],
})
export class WishlistModule {}
