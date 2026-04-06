import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Video, VideoType } from 'src/videos/video.model';
import { WebsocketService } from 'src/websocket/websocket.service';

interface CloudinaryContextCustom {
    userId?: string;
    user_id?: string;
    /** Same UUID for video upload + raw SRT upload in one Colab session. */
    job_id?: string;
    /** highlight | mascot (video). For raw SRT upload Colab may send type: srt — we do not persist that as VideoType. */
    type?: string;
}

interface CloudinaryPayload {
    secure_url?: string;
    url?: string;
    public_id?: string;
    duration?: number;
    resource_type?: string;
    format?: string;
    context?: {
        custom?: CloudinaryContextCustom;
    };
    display_name?: string;
    original_filename?: string;
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

    /**
     * Cloudinary notifications for `resource_type: video` (MP4) and `resource_type: raw` (.srt).
     * Both must send the same `context.custom.job_id` (and `user_id`) so we upsert one row.
     */
    async handleUpload(payload: CloudinaryPayload) {
        const { secure_url, url, public_id, duration, resource_type, format, context, display_name, original_filename } =
            payload;

        const assetUrl = secure_url ?? url;
        if (!assetUrl) {
            this.logger.warn('Cloudinary webhook missing secure_url/url');
            return { ignored: true };
        }

        const custom = context?.custom;
        const jobId =
            typeof custom?.job_id === 'string' && custom.job_id.trim().length > 0
                ? custom.job_id.trim()
                : undefined;

        const userIdStr = custom?.userId ?? custom?.user_id;
        const userId =
            typeof userIdStr === 'string' && userIdStr.trim().length > 0
                ? Number(userIdStr)
                : undefined;

        if (!userId || Number.isNaN(userId)) {
            this.logger.warn('Cloudinary webhook missing valid userId in context.custom');
            return { ignored: true, reason: 'missing_user_id' };
        }

        const rt = resource_type?.toLowerCase() ?? '';

        if (rt === 'video') {
            return this.handleCloudinaryVideo({
                assetUrl,
                public_id,
                duration,
                display_name,
                original_filename,
                custom,
                userId,
                jobId,
            });
        }

        if (rt === 'raw') {
            if (!jobId) {
                this.logger.warn('Cloudinary webhook missing job_id in context.custom');
                return { ignored: true, reason: 'missing_job_id' };
            }
            return this.handleCloudinaryRawSrt({
                assetUrl,
                format,
                userId,
                jobId,
            });
        }

        this.logger.debug(`Ignoring Cloudinary resource_type=${resource_type}`);
        return { ignored: true };
    }

    private resolveVideoType(custom: CloudinaryContextCustom | undefined): VideoType {
        return custom?.type?.toLowerCase() === VideoType.MASCOT
            ? VideoType.MASCOT
            : VideoType.HIGHLIGHT;
    }

    private resolveVideoName(params: {
        originalFilename?: string;
        displayName?: string;
        type: VideoType;
    }): string | null {
        const originalFilename =
            typeof params.originalFilename === 'string'
                ? params.originalFilename.trim()
                : '';

        if (originalFilename) {
            return `${originalFilename}_${params.type}`;
        }

        const displayName =
            typeof params.displayName === 'string'
                ? params.displayName.trim()
                : '';

        return displayName || null;
    }

    private async handleCloudinaryVideo(params: {
        assetUrl: string;
        public_id?: string;
        duration?: number;
        display_name?: string;
        original_filename?: string;
        custom?: CloudinaryContextCustom;
        userId: number;
        jobId?: string;
    }) {
        const { assetUrl, public_id, duration, display_name, original_filename, custom, userId, jobId } = params;

        const type = this.resolveVideoType(custom);
        const resolvedName = this.resolveVideoName({
            originalFilename: original_filename,
            displayName: display_name,
            type,
        });

        const cloudName = process.env.CLOUD_NAME?.trim();
        const publicId = typeof public_id === 'string' ? public_id.trim() : undefined;
        const thumbnailUrl =
            cloudName && publicId
                ? `https://res.cloudinary.com/${cloudName}/video/upload/so_1/${publicId}.jpg`
                : undefined;

        let row: Video;

        if (jobId) {
            const [v, created] = await this.videoModel.findOrCreate({
                where: { job_id: jobId },
                defaults: {
                    job_id: jobId,
                    user_id: userId,
                    type,
                    url: assetUrl,
                    duration: typeof duration === 'number' ? duration : null,
                    name: resolvedName,
                    thumbnail:
                        thumbnailUrl ?? 'https://placehold.co/320x180/png?text=thumbnail',
                    srt_raw_url: null,
                },
            });

            row = v;

            if (!created) {
                await row.update({
                    user_id: userId,
                    type,
                    url: assetUrl,
                    duration: typeof duration === 'number' ? duration : row.duration,
                    ...(resolvedName ? { name: resolvedName } : {}),
                    ...(thumbnailUrl ? { thumbnail: thumbnailUrl } : {}),
                });
                this.logger.log(`Updated video row id=${row.id} job_id=${jobId} (video asset)`);
            } else {
                this.logger.log(
                    `Created video row id=${row.id} job_id=${jobId} user_id=${userId} type=${type}`,
                );
            }
        } else {
            row = await this.videoModel.create({
                job_id: null,
                user_id: userId,
                type,
                url: assetUrl,
                duration: typeof duration === 'number' ? duration : null,
                name: resolvedName,
                thumbnail:
                    thumbnailUrl ?? 'https://placehold.co/320x180/png?text=thumbnail',
                srt_raw_url: null,
            });

            this.logger.log(
                `Created direct-upload video row id=${row.id} user_id=${userId} type=${type} (no job_id)`,
            );
        }

        await row.reload();

        this.websocketService.notifyUploadCompleted(userId, {
            id: row.id,
            url: row.url ?? '',
            type: row.type,
            duration: duration ?? undefined,
        });

        return { success: true, id: row.id };
    }

    private isSrtRawUpload(format: string | undefined, assetUrl: string): boolean {
        const fmt = format?.toLowerCase() ?? '';
        if (fmt === 'srt') return true;
        return /\.srt(\?|$)/i.test(assetUrl);
    }

    private async handleCloudinaryRawSrt(params: {
        assetUrl: string;
        format?: string;
        userId: number;
        jobId: string;
    }) {
        const { assetUrl, format, userId, jobId } = params;

        if (!this.isSrtRawUpload(format, assetUrl)) {
            this.logger.debug(`Ignoring raw upload format=${format} url=${assetUrl}`);
            return { ignored: true, reason: 'not_srt' };
        }

        const [row, created] = await this.videoModel.findOrCreate({
            where: { job_id: jobId },
            defaults: {
                job_id: jobId,
                user_id: userId,
                type: VideoType.HIGHLIGHT,
                url: null,
                duration: null,
                thumbnail: 'https://placehold.co/320x180/png?text=thumbnail',
                srt_raw_url: assetUrl,
            },
        });

        if (!created) {
            await row.update({ srt_raw_url: assetUrl });
            this.logger.log(`Updated srt_raw_url for video id=${row.id} job_id=${jobId}`);
        } else {
            this.logger.log(
                `Created placeholder video id=${row.id} job_id=${jobId} (SRT first, video pending)`,
            );
        }

        return { success: true, id: row.id };
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

        this.websocketService.notifyVideoCompleted(userId, {
            url: url,
            type: type,
            duration: duration ?? undefined,
        });

        return { success: true };
    }
}
