import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import databaseConfig from '../config/database.config';
import { User } from '../users/user.model';
import { Video } from '../models/video.model';
import { Cart } from '../models/cart.model';
import { CartItem } from '../models/cart-item.model';
import { Course } from '../models/course.model';
import { RoadMap } from '../models/roadmap.model';
import { RoadMapCourse } from '../models/roadmap-course.model';
import { Feedback } from '../models/feedback.model';
import { FeedbackReaction } from '../models/feedback-reaction.model';
import { Enroll } from '../models/enroll.model';
import { LessonProgress } from '../models/lesson-progress.model';
import { MascotImage } from 'src/models/images.model';
import { Report } from '../models/report.model';
import { AuditLog } from '../audit_logs/audit-log.model';
import { Lesson } from 'src/models/lesson.model';
import { LessonActivity } from 'src/models/lesson-activity.model';
import { Quiz } from 'src/models/quiz.model';
import { QuizQuestion } from 'src/models/quiz-question.model';
import { QuizOption } from 'src/models/quiz-option.model';
import { InstructorFollow } from 'src/models/instructor-follow.model';
import { Notification } from 'src/models/notification.model';

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
            MascotImage,
            Course,
            RoadMap,
            RoadMapCourse,
            Cart,
            CartItem,
            Feedback,
            FeedbackReaction,
            Enroll,
            LessonProgress,
            Report,
            AuditLog,
            Lesson,
            LessonActivity,
            Quiz,
            QuizQuestion,
            QuizOption,
            InstructorFollow,
            Notification,
          ],
          autoLoadModels: true,
          synchronize: false, // Set to true to create new tables (carts, cart_items)
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule { }
