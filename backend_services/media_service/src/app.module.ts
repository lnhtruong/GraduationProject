import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
// import { JwtModule } from '@nestjs/jwt';
import { AppController } from './app.controller';
import { AppService } from './app.service';
// import { UsersModule } from './users/users.module';
import { DatabaseModule } from './database/database.module';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import redisConfig from './config/redis.config';
import { VideoModule } from './videos/video.module';
import { MascotImageModule } from './images_mascot/image_mascot.module';
import { ProjectModule } from './projects/project.module';
import { MascotOverlayModule } from './mascot_overlays/mascot_overlay.module';
import { WebsocketModule } from './websocket/websocket.module';
import { WebhookModule } from './webhook/webhook.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { FeedModule } from './feed/feed.module';
import { BunnyModule } from './bunny/bunny.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, jwtConfig, redisConfig],
    }),
    ScheduleModule.forRoot(),
    // JwtModule.register({
    //   global: true,
    // }),
    DatabaseModule,
    // UsersModule,
    VideoModule,
    MascotImageModule,
    ProjectModule,
    MascotOverlayModule,
    WebsocketModule,
    WebhookModule,
    CloudinaryModule,
    BunnyModule,
    FeedModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
