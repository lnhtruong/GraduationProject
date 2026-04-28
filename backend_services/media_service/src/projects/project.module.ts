import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Project } from './project.model';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';
// import { WebhookController } from '../webhook/webhook.controller';
// import { WebhookService } from '../webhook/webhook.service';
import { Video } from 'src/videos/video.model';
import { WebsocketModule } from 'src/websocket/websocket.module';
import { WebhookModule } from 'src/webhook/webhook.module';

@Module({
    imports: [SequelizeModule.forFeature([Project, Video]), WebsocketModule, WebhookModule],
    controllers: [ProjectController],
    providers: [ProjectService],
    exports: [ProjectService],
})
export class ProjectModule { }


