import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
// import databaseConfig from '../config/database.config';
// import { User } from '../users/user.model';
import { MascotImage } from 'src/images_mascot/images.model';
import { Video } from 'src/videos/video.model';
import { Project } from 'src/projects/project.model';
import { HighlightFeed } from 'src/models/highlight_feed.model';
import { FeedInteraction } from 'src/models/feed_interactions.model';
import { FeedView } from 'src/models/feed_views.model';
import { FeedComment } from 'src/models/feed_comments.model';
import { Course } from 'src/models/course.model';
import { User } from 'src/models/user.model';

@Module({
  imports: [
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const dbConfig = configService.get('database');
        return {
          ...dbConfig,
          models: [
            MascotImage,
            Video,
            Project,
            HighlightFeed,
            FeedInteraction,
            FeedView,
            FeedComment,
            Course,
            User,
          ],
          autoLoadModels: true,
          synchronize: false, // Set to true only for development
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule { }
