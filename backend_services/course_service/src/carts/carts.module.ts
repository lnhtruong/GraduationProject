import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Cart } from '../models/cart.model';
import { CartItem } from '../models/cart-item.model';
import { Course } from '../models/course.model';
import { Enroll } from '../models/enroll.model';
import { Feedback } from '../models/feedback.model';
import { HighlightFeed } from '../models/highlight-feed.model';
import { Video } from '../models/video.model';
import { User } from '../users/user.model';
import { CartsService } from './carts.service';
import { CartsController } from './carts.controller';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Cart,
      CartItem,
      Course,
      Video,
      User,
      Feedback,
      Enroll,
      HighlightFeed,
    ]),
  ],
  providers: [CartsService],
  controllers: [CartsController],
  exports: [CartsService],
})
export class CartsModule {}
