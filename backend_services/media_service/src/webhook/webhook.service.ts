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
    public_id?: string;
    duration?: number;
    resource_type?: string;
    context?: {
        custom?: CloudinaryContextCustom;
    };
    display_name?: string;
}

interface ai_model_result {
    user_id?: string | number;
    url?: string;
    video_url?: string;
    duration?: number;
    type?: VideoType | string;
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
        const { secure_url, url, public_id, duration, resource_type, context, display_name } = payload;

        // console.log('check information: ', secure_url, url, duration, context, display_name);

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

        let type: VideoType = VideoType.HIGHLIGHT;
        type =
            custom?.type?.toLowerCase() === VideoType.MASCOT
                ? VideoType.MASCOT
                : VideoType.HIGHLIGHT;

        const cloudName = process.env.CLOUD_NAME?.trim();
        const publicId = typeof public_id === 'string' ? public_id.trim() : undefined;
        // const publicIdWithoutExt = publicId?.replace(/\.[a-z0-9]+$/i, '');

        const thumbnailUrl =
            cloudName && publicId
                ? `https://res.cloudinary.com/${cloudName}/video/upload/so_1/${publicId}.jpg`
                : undefined;

        const createPayload: Record<string, unknown> = {
            user_id: userId,
            type,
            url: videoUrl,
            duration: typeof duration === 'number' ? duration : null,
        };
        if (display_name) createPayload.name = display_name;
        if (thumbnailUrl) createPayload.thumbnail = thumbnailUrl;

        // console.log('payload create: ', createPayload);

        let created: Video;
        try {
            created = await this.videoModel.create(createPayload as any);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.logger.error(`Cloudinary webhook create video failed: ${message}`);
            throw error;
        }

        this.logger.log(
            `Created video from Cloudinary webhook id=${created.id} user_id=${created.user_id} type=${created.type}`,
        );

        return { success: true, id: created.id };
    }

    async handleAIResult(payload: ai_model_result) {
        const userIdRaw = payload.user_id;
        const url = payload.url ?? payload.video_url;
        const duration = payload.duration;
        const display_name = payload.display_name;

        const type: VideoType | undefined =
            payload.type?.toString().toLowerCase() === VideoType.MASCOT
                ? VideoType.MASCOT
                : payload.type?.toString().toLowerCase() === VideoType.HIGHLIGHT
                    ? VideoType.HIGHLIGHT
                    : undefined;

        if (type !== VideoType.MASCOT && type !== VideoType.HIGHLIGHT) {
            this.logger.debug(`Ignoring non-video type=${type}`);
            return { ignored: true };
        }

        if (!url) {
            this.logger.warn('ai model webhook missing url');
            return { ignored: true };
        }

        const userIdStr =
            typeof userIdRaw === 'number'
                ? String(userIdRaw)
                : userIdRaw;

        const userId =
            typeof userIdStr === 'string' && userIdStr.trim().length > 0
                ? Number(userIdStr)
                : undefined;

        if (!userId || Number.isNaN(userId)) {
            this.logger.warn(`AI model webhook missing valid userId. payload=${JSON.stringify(payload)}`);
            return { ignored: true, reason: 'missing_user_id' };
        }

        const createPayload: Record<string, unknown> = {
            user_id: userId,
            type,
            url,
            duration: typeof duration === 'number' ? duration : null,
        };
        if (display_name) createPayload.name = display_name;

        let created: Video;
        try {
            created = await this.videoModel.create(createPayload as any);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.logger.error(`AI webhook create video failed: ${message}`);
            throw error;
        }

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
