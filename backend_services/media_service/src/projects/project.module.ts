import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Project } from './project.model';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';
import { CloudinaryWebhookController } from './cloudinary-webhook.controller';
import { CloudinaryWebhookService } from './cloudinary-webhook.service';
import { Video } from 'src/video_mascots/video.model';

@Module({
    imports: [SequelizeModule.forFeature([Project, Video])],
    controllers: [ProjectController, CloudinaryWebhookController],
    providers: [ProjectService, CloudinaryWebhookService],
    exports: [ProjectService],
})
export class ProjectModule { }


