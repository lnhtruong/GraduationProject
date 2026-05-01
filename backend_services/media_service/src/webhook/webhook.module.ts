import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { WebhookService } from './webhook.service';
import { WebhookController } from './webhook.controller';
import { Video } from 'src/videos/video.model';
import { BunnyModule } from 'src/bunny/bunny.module';
import { SseModule } from 'src/sse/sse.module';

@Module({
    imports: [
        SequelizeModule.forFeature([Video]),
        SseModule,
        BunnyModule,
    ],
    providers: [WebhookService],
    controllers: [WebhookController],
    exports: [WebhookService],
})
export class WebhookModule { }
