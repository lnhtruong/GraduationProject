import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Video, VideoType } from 'src/videos/video.model';
import { WebsocketService } from 'src/websocket/websocket.service';

interface CloudinaryContextCustom {
    userId?: string;
    user_id?: string;
    type?: string;
}

interface CloudinaryPayload {
    secure_url?: string;
    url?: string;
    duration?: number;
    resource_type?: string;
    context?: {
        custom?: CloudinaryContextCustom;
    };
    display_name?: string;
}

interface ai_model_result {
    user_id: string;
    url: string;
    duration?: number;
    type: VideoType;
    display_name?: string;
}

@Injectable()
export class WebhookService {
    private readonly logger = new Logger(WebhookService.name);

    constructor(
        @InjectModel(Video)
        private readonly videoModel: typeof Video,
        private readonly websocketService: WebsocketService,
    ) { }

    async handleUpload(payload: CloudinaryPayload) {
        const { secure_url, url, duration, resource_type, context, display_name } = payload;

        if (resource_type !== 'video') {
            this.logger.debug(`Ignoring non-video resource_type=${resource_type}`);
            return { ignored: true };
        }

        const videoUrl = secure_url ?? url;
        if (!videoUrl) {
            this.logger.warn('Cloudinary webhook missing secure_url/url');
            return { ignored: true };
        }

        // Optional: enforce max 3 minutes
        // if (typeof duration === 'number' && duration > 180) {
        //     this.logger.warn(`Video duration exceeds limit: ${duration}s`);
        //     return { ignored: true, reason: 'duration_exceeded' };
        // }

        const custom = context?.custom;
        const userIdStr = custom?.userId ?? custom?.user_id;

        const userId =
            typeof userIdStr === 'string' && userIdStr.trim().length > 0
                ? Number(userIdStr)
                : undefined;

        if (!userId || Number.isNaN(userId)) {
            this.logger.warn('Cloudinary webhook missing valid userId in context.custom');
            return { ignored: true, reason: 'missing_user_id' };
        }

        const rawType = custom?.type?.toLowerCase();
        const type: VideoType =
            rawType === VideoType.MASCOT
                ? VideoType.MASCOT
                : VideoType.HIGHLIGHT;

        const created = await this.videoModel.create({
            user_id: userId,
            type,
            url: videoUrl,
            duration: typeof duration === 'number' ? duration : null,
            name: display_name,
            // duration: 5,
        });

        this.logger.log(
            `Created video from Cloudinary webhook id=${created.id} user_id=${created.user_id} type=${created.type}`,
        );

        return { success: true, id: created.id };
    }

    async handleAIResult(payload: ai_model_result) {
        const { user_id, url, duration, type, display_name } = payload;

        if (type !== VideoType.MASCOT && type !== VideoType.HIGHLIGHT) {
            this.logger.debug(`Ignoring non-video type=${type}`);
            return { ignored: true };
        }

        if (!url) {
            this.logger.warn('ai model webhook missing url');
            return { ignored: true };
        }

        const userIdStr = user_id;

        const userId =
            typeof userIdStr === 'string' && userIdStr.trim().length > 0
                ? Number(userIdStr)
                : undefined;

        if (!userId || Number.isNaN(userId)) {
            this.logger.warn('AI model webhook missing valid userId');
            return { ignored: true, reason: 'missing_user_id' };
        }

        const created = await this.videoModel.create({
            user_id: userId,
            type,
            url,
            duration: typeof duration === 'number' ? duration : null,
            name: display_name,
        });

        this.logger.log(
            `Created video from AI model webhook id=${created.id} user_id=${created.user_id} type=${created.type}`,
        );

        // Gửi thông báo tới client qua WebSocket
        this.websocketService.notifyVideoCompleted(userId, {
            id: created.id,
            url: created.url,
            type: created.type,
            duration: created.duration ?? undefined,
        });

        return { success: true, id: created.id };
    }
}
