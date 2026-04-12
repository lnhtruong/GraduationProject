import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
// import { JwtModule } from '@nestjs/jwt';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { DatabaseModule } from './database/database.module';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import { LessonsModule } from './lessons/lesson.module';
import { LessonActivitiesModule } from './lessonActivities/lesson.activities.module';
import { QuizzesModule } from './quizzes/quizzes.module';
import { CoursesModule } from './course/course.module';
import { RoadmapsModule } from './roadmaps/roadmaps.module';
import { EnrollsModule } from './enrolls/enrolls.module';
import { LessonProgressModule } from './lessonProgress/lesson-progress.module';

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
    UsersModule,
    CoursesModule,
    LessonsModule,
    LessonActivitiesModule,
    QuizzesModule,
    RoadmapsModule,
    EnrollsModule,
    LessonProgressModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
