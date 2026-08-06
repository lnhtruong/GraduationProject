import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Course } from 'src/models/course.model';
import { Lesson } from 'src/models/lesson.model';
import { Report } from 'src/models/report.model';
import { User } from 'src/users/user.model';
import { MascotImage } from 'src/models/images.model';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [SequelizeModule.forFeature([Report, Course, Lesson, User, MascotImage])],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
