import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { InstructorFollow } from '../models/instructor-follow.model';
import { User } from '../users/user.model';
import { Notification } from '../models/notification.model';
import {
  InstructorsFollowController,
  UsersFollowingController,
} from './follows.controller';
import { FollowsService } from './follows.service';

@Module({
  imports: [SequelizeModule.forFeature([InstructorFollow, User, Notification])],
  controllers: [InstructorsFollowController, UsersFollowingController],
  providers: [FollowsService],
  exports: [FollowsService],
})
export class FollowsModule {}
