import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { WebhookService } from './webhook.service';
import { WebhookController } from './webhook.controller';
import { Video } from 'src/videos/video.model';
import { WebsocketModule } from 'src/websocket/websocket.module';
import { BunnyModule } from 'src/bunny/bunny.module';

@Module({
    imports: [
        SequelizeModule.forFeature([Video]),
        WebsocketModule,
        BunnyModule
    ],
    providers: [WebhookService],
    controllers: [WebhookController],
    exports: [WebhookService],
})
export class WebhookModule { }
