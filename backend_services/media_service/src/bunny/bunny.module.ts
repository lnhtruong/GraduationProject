import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { BunnyController } from './bunny.controller';
import { BunnyService } from './bunny.service';
import { Video } from 'src/videos/video.model';

@Module({
  imports: [SequelizeModule.forFeature([Video])],
  controllers: [BunnyController],
  providers: [BunnyService],
  exports: [BunnyService],
})
export class BunnyModule { }

