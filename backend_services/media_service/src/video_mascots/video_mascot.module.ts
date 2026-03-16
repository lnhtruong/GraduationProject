import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Video } from './video.model';
import { MascotVideoController } from './video_mascot.controller';
import { MascotVideoService } from './video_mascot.service';
import { MascotImage } from 'src/images_mascot/images.model';

@Module({
    imports: [SequelizeModule.forFeature([Video, MascotImage])],
    controllers: [MascotVideoController],
    providers: [MascotVideoService],
    exports: [MascotVideoService],
})
export class MascotVideoModule { }
