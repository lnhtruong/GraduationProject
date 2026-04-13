import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { FeedController } from './feed.controller';
import { FeedService } from './feed.service';
import { HighlightFeed } from '../models/highlight_feed.model';
import { FeedInteraction } from '../models/feed_interactions.model';
import { FeedView } from '../models/feed_views.model';
import { Video } from '../videos/video.model';
import { Course } from '../models/course.model';
import { User } from '../models/user.model';

@Module({
  imports: [
    SequelizeModule.forFeature([
      HighlightFeed,
      FeedInteraction,
      FeedView,
      Video,
      Course,
      User,
    ]),
  ],
  controllers: [FeedController],
  providers: [FeedService],
  exports: [FeedService],
})
export class FeedModule {}