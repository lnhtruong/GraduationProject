import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { WebhookService } from './webhook.service';
import { WebhookController } from './webhook.controller';
import { Video } from 'src/videos/video.model';
import { Image } from 'src/images_mascot/images.model';
import { BunnyModule } from 'src/bunny/bunny.module';
import { NotificationModule } from 'src/notifications/notification.module';

@Module({
    imports: [
        SequelizeModule.forFeature([Video, Image]),
        NotificationModule,
        BunnyModule,
    ],
    providers: [WebhookService],
    controllers: [WebhookController],
    exports: [WebhookService],
})
export class WebhookModule { }
