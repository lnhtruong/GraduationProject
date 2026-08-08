import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Video } from './video.model';
import { VideoController } from './video.controller';
import { VideoService } from './video.service';
import { MascotImage } from 'src/images_mascot/images.model';
import { HighlightFeed } from 'src/models/highlight_feed.model';

@Module({
    imports: [SequelizeModule.forFeature([Video, MascotImage, HighlightFeed])],
    controllers: [VideoController],
    providers: [VideoService],
    exports: [VideoService],
})
export class VideoModule { }
