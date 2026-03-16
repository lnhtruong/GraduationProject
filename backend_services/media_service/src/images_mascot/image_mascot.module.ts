import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { MascotImage } from './images.model';
import { MascotImageController } from './image_mascot.controller';
import { MascotImageService } from './image_mascot.service';

@Module({
    imports: [SequelizeModule.forFeature([MascotImage])],
    controllers: [MascotImageController],
    providers: [MascotImageService],
    exports: [MascotImageService],
})
export class MascotImageModule { }