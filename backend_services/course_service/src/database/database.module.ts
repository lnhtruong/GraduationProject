import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import databaseConfig from '../config/database.config';
import { User } from '../users/user.model';
import { Video } from '../models/video.model';
import { Course } from '../models/course.model';
import { RoadMap } from '../models/roadmap.model';
import { RoadMapCourse } from '../models/roadmap-course.model';
import { Enroll } from '../models/enroll.model';
import { LessonProgress } from '../models/lesson-progress.model';

@Module({
  imports: [
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const dbConfig = configService.get('database');
        return {
          ...dbConfig,
          models: [
            User,
            Video,
            Course,
            RoadMap,
            RoadMapCourse,
            Enroll,
            LessonProgress,
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
