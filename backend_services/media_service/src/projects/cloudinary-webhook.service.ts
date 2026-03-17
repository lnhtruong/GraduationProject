import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Video, VideoType } from 'src/video_mascots/video.model';

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

@Injectable()
export class CloudinaryWebhookService {
    private readonly logger = new Logger(CloudinaryWebhookService.name);

    constructor(
        @InjectModel(Video)
        private readonly videoModel: typeof Video,
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
}


