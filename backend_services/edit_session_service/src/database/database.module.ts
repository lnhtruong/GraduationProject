import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
// import databaseConfig from '../config/database.config';
// import { User } from '../users/user.model';
import { MascotImage } from 'src/mascot_overlays/images.model';
import { MascotVideo } from 'src/mascot_overlays/video_mascot.model';
import { MascotOverlay } from 'src/mascot_overlays/mascot_overlay.model';
import { Project } from 'src/projects/project.model';

@Module({
  imports: [
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const dbConfig = configService.get('database');
        return {
          ...dbConfig,
          models: [Project, MascotImage, MascotVideo, MascotOverlay],
          autoLoadModels: true,
          synchronize: false, // Set to true only for development
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule { }
