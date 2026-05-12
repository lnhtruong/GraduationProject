import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { FeedController } from './feed.controller';
import { FeedService } from './feed.service';
import { RedisModule } from '../redis/redis.module';
import { RedisService } from '../redis/redis.service';
import { FeedRecommendationWorker } from './feed-recommendation.worker';
import { HighlightFeed } from '../models/highlight_feed.model';
import { FeedInteraction } from '../models/feed_interactions.model';
import { FeedView } from '../models/feed_views.model';
import { FeedComment } from '../models/feed_comments.model';
import { Video } from '../videos/video.model';
import { Course } from '../models/course.model';
import { User } from '../models/user.model';
import { NotificationModule } from '../notifications/notification.module';

@Module({
  imports: [
    SequelizeModule.forFeature([
      HighlightFeed,
      FeedInteraction,
      FeedView,
      FeedComment,
      Video,
      Course,
      User,
    ]),
    RedisModule,
    NotificationModule,
  ],
  controllers: [FeedController],
  providers: [FeedService, RedisService, FeedRecommendationWorker],
  exports: [FeedService],
})
export class FeedModule {}