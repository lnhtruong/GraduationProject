import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Course } from 'src/models/course.model';
import { RoadMapCourse } from 'src/models/roadmap-course.model';
import { RoadMap } from 'src/models/roadmap.model';
import { User } from 'src/users/user.model';
import { RoadmapsController } from './roadmaps.controller';
import { RoadmapsService } from './roadmaps.service';

@Module({
  imports: [SequelizeModule.forFeature([RoadMap, RoadMapCourse, Course, User])],
  controllers: [RoadmapsController],
  providers: [RoadmapsService],
  exports: [RoadmapsService],
})
export class RoadmapsModule {}