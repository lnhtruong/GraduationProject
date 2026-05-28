import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from '../users/user.model';
import { LecturerUpgradeRequest } from './lecturer-request.model';
import { LecturerRequestsController } from './lecturer-requests.controller';
import { LecturerRequestsService } from './lecturer-requests.service';

@Module({
  imports: [SequelizeModule.forFeature([LecturerUpgradeRequest, User])],
  controllers: [LecturerRequestsController],
  providers: [LecturerRequestsService],
  exports: [LecturerRequestsService],
})
export class LecturerRequestsModule {}
