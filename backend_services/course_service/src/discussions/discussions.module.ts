import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { DiscussionPost } from '../models/discussion-post.model';
import { DiscussionUpvote } from '../models/discussion-upvote.model';
import { Lesson } from '../models/lesson.model';
import { Course } from '../models/course.model';
import { Enroll } from '../models/enroll.model';
import { User } from '../users/user.model';
import { Notification } from '../models/notification.model';
import { DiscussionsController } from './discussions.controller';
import { DiscussionsService } from './discussions.service';

@Module({
  imports: [
    SequelizeModule.forFeature([
      DiscussionPost,
      DiscussionUpvote,
      Lesson,
      Course,
      Enroll,
      User,
      Notification,
    ]),
  ],
  controllers: [DiscussionsController],
  providers: [DiscussionsService],
  exports: [DiscussionsService],
})
export class DiscussionsModule {}
