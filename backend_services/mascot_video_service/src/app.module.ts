import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
// import { JwtModule } from '@nestjs/jwt';
import { AppController } from './app.controller';
import { AppService } from './app.service';
// import { UsersModule } from './users/users.module';
import { DatabaseModule } from './database/database.module';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import { MascotVideoModule } from './video_mascots/video_mascot.module';
import { MascotImageModule } from './images_mascot/image_mascot.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, jwtConfig],
    }),
    // JwtModule.register({
    //   global: true,
    // }),
    DatabaseModule,
    // UsersModule,
    MascotVideoModule,
    MascotImageModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
