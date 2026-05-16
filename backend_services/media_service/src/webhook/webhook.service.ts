import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Video, VideoType } from 'src/videos/video.model';
import { Image } from 'src/images_mascot/images.model';
// import { WebsocketService } from 'src/websocket/websocket.service';
import { BunnyService } from 'src/bunny/bunny.service';
import { NotificationService } from 'src/notifications/notification.service';
import {
    NotificationEventType,
    NotificationSourceType,
    NotificationSseEventType,
} from 'src/notifications/notification.enums';

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

export interface ai_model_result {
    event?: 'stage_update' | 'completed' | 'job_failed'; // Thêm field này
    job_id?: string;
    user_id: string | number;
    type?: string;

    // Dành cho completed
    video_url?: string;
    url?: string;
    srt_url?: string;
    duration?: number;
    display_name?: string;

    // Dành cho progress / failed
    stage?: string;
    status?: string;
    error_message?: string;
}

@Injectable()
export class WebhookService {
    private readonly logger = new Logger(WebhookService.name);

    constructor(
        @InjectModel(Video)
        private readonly videoModel: typeof Video,
        @InjectModel(Image)
        private readonly imageModel: typeof Image,
        // private readonly websocketService: WebsocketService,
        private readonly notificationService: NotificationService,
        private readonly bunnyService: BunnyService,
    ) { }

    /**
     * Bunny Stream status webhook: payload uses PascalCase (`VideoGuid`, `Status`).
     * On encode finished (3) or playable (4), pull play data and persist HLS / fallback URL.
     */
    async handleBunnyStream(payload: Record<string, unknown>) {
        const videoGuid =
            typeof payload.VideoGuid === 'string'
                ? payload.VideoGuid
                : typeof payload.videoGuid === 'string'
                    ? payload.videoGuid
                    : undefined;

        const status =
            typeof payload.Status === 'number'
                ? payload.Status
                : typeof payload.status === 'number'
                    ? payload.status
                    : undefined;

        const libraryId = payload.VideoLibraryId ?? payload.videoLibraryId;

        this.logger.log(
            `[BunnyStream] webhook VideoGuid=${videoGuid} Status=${status} VideoLibraryId=${libraryId}`,
        );

        if (!videoGuid) {
            this.logger.warn('[BunnyStream] missing VideoGuid');
            return { ok: false, ignored: true, reason: 'missing_video_guid' };
        }

        const row = await this.videoModel.findOne({
            where: { bunny_video_guid: videoGuid, type: VideoType.LONG },
        });

        if (!row) {
            this.logger.warn(
                `[BunnyStream] no DB row for bunny_video_guid=${videoGuid} (init-upload must run first)`,
            );
            return { ok: true, ignored: true, reason: 'unknown_video_guid' };
        }

        if (status !== 3 && status !== 4) {
            this.logger.log(
                `[BunnyStream] status=${status} — skip play fetch (only 3=finished, 4=playable)`,
            );
            return { ok: true, skipped: true, status, videoId: row.id };
        }

        let play: Record<string, unknown>;
        let meta: Record<string, unknown>;
        try {
            play = (await this.bunnyService.getPlayData(videoGuid)) as Record<string, unknown>;
            meta = (await this.bunnyService.getVideoStatus(videoGuid)) as Record<string, unknown>;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            this.logger.error(`[BunnyStream] Bunny API error: ${message}`);
            throw error;
        }

        this.logger.log(
            `[BunnyStream] play response isPlayable=${String(play.isPlayable)} keys=${Object.keys(play).join(',')}`,
        );

        const videoPlaylistUrl =
            typeof play.videoPlaylistUrl === 'string' ? play.videoPlaylistUrl : undefined;
        const fallbackUrl = typeof play.fallbackUrl === 'string' ? play.fallbackUrl : undefined;
        const originalUrl = typeof play.originalUrl === 'string' ? play.originalUrl : undefined;
        const thumb =
            typeof play.thumbnailUrl === 'string'
                ? play.thumbnailUrl
                : typeof play.previewUrl === 'string'
                    ? play.previewUrl
                    : undefined;

        const videoMeta =
            play.video !== null &&
                typeof play.video === 'object' &&
                !Array.isArray(play.video)
                ? (play.video as Record<string, unknown>)
                : undefined;
        const titleFromPlay =
            typeof videoMeta?.title === 'string' && videoMeta.title.trim().length > 0
                ? videoMeta.title.trim()
                : undefined;

        const url = videoPlaylistUrl ?? fallbackUrl ?? originalUrl ?? null;

        if (!url) {
            this.logger.warn('[BunnyStream] no playback URL in play response');
            return { ok: false, reason: 'no_playback_url', videoId: row.id };
        }

        const durationRaw = meta.length ?? meta.duration ?? videoMeta?.length;
        const duration =
            typeof durationRaw === 'number' && !Number.isNaN(durationRaw)
                ? durationRaw
                : row.duration;

        await row.update({
            url,
            thumbnail: thumb ?? row.thumbnail,
            duration,
            ...(titleFromPlay ? { name: titleFromPlay } : {}),
        });

        this.logger.log(
            `[BunnyStream] updated video id=${row.id} url stored (HLS preferred): ${url.substring(0, 80)}…`,
        );

        await row.reload();

        await this.notificationService.createAndEmit({
            userId: row.user_id,
            eventType: NotificationEventType.VIDEO_UPLOAD_COMPLETED,
            sseEventType: NotificationSseEventType.UPLOAD_VIDEO_COMPLETED,
            title: 'Video upload completed',
            message: 'Your course video is ready to use',
            sourceType: NotificationSourceType.VIDEO,
            sourceId: row.id,
            payload: {
                videoId: row.id,
                url,
                type: VideoType.LONG,
                duration: duration ?? undefined,
                name: row.name ?? undefined,
            },
        });

        return {
            ok: true,
            id: row.id,
            status,
            urlKind: videoPlaylistUrl ? 'hls' : fallbackUrl ? 'mp4_fallback' : 'original',
        };
    }

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
        } else if (rt === 'raw') {
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
        } else if (rt === 'image') {
            return this.handleCloudinaryImage({
                assetUrl,
                public_id,
                format,
                display_name,
                original_filename,
                custom,
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

        await this.notificationService.createAndEmit({
            userId,
            eventType: NotificationEventType.VIDEO_UPLOAD_COMPLETED,
            sseEventType: NotificationSseEventType.UPLOAD_VIDEO_COMPLETED,
            title: 'Video upload completed',
            message: 'Your video has been uploaded successfully',
            sourceType: NotificationSourceType.VIDEO,
            sourceId: row.id,
            payload: {
                videoId: row.id,
                url: row.url ?? '',
                type: row.type,
                duration: duration ?? undefined,
                name: resolvedName ?? undefined,
                job_id: jobId,
            },
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
        // 1. Xử lý User ID trước (logic cũ của bạn)
        const userIdRaw = payload.user_id;
        const userIdStr = typeof userIdRaw === 'number' ? String(userIdRaw) : userIdRaw;
        const userId = typeof userIdStr === 'string' && userIdStr.trim().length > 0
            ? Number(userIdStr)
            : undefined;

        if (!userId || Number.isNaN(userId)) {
            this.logger.warn(`AI model webhook missing valid userId. payload=${JSON.stringify(payload)}`);
            return { ignored: true, reason: 'missing_user_id' };
        }

        // 2. Map Video Type (accept unknown string for progress/error relay)
        const rawType = payload.type?.toString().toLowerCase();
        const type: VideoType | undefined =
            rawType === VideoType.MASCOT ? VideoType.MASCOT
                : rawType === VideoType.HIGHLIGHT ? VideoType.HIGHLIGHT
                    : rawType === VideoType.LONG ? VideoType.LONG
                        : undefined;
        const typeForSse = type ?? rawType ?? 'unknown';

        let completedVideoId: number | undefined;

        // 3. Phân luồng xử lý theo EVENT
        // Mặc định là 'completed' nếu Python chưa kịp update code cũ
        const eventType = payload.event || 'completed';

        // console.log('check BE: ', payload);

        switch (eventType) {
            case 'stage_update':
                // Bắn SSE báo progress cho FE
                await this.notificationService.createAndEmit({
                    userId,
                    eventType: NotificationEventType.VIDEO_JOB_PROGRESS,
                    sseEventType: NotificationSseEventType.VIDEO_PROGRESS,
                    title: 'Video processing update',
                    message: payload.stage
                        ? `Current stage: ${payload.stage}`
                        : 'Your video is being processed',
                    sourceType: NotificationSourceType.VIDEO_JOB,
                    payload: {
                        jobId: payload.job_id,
                        type: typeForSse,
                        stage: payload.stage,
                        status: 'processing',
                    },
                });
                break;

            case 'job_failed':
                // Bắn SSE báo lỗi
                await this.notificationService.createAndEmit({
                    userId,
                    eventType: NotificationEventType.VIDEO_JOB_FAILED,
                    sseEventType: NotificationSseEventType.VIDEO_ERROR,
                    title: 'Video processing failed',
                    message: payload.error_message ?? 'Unexpected error while processing video',
                    sourceType: NotificationSourceType.VIDEO_JOB,
                    payload: {
                        success: false,
                        jobId: payload.job_id,
                        type: typeForSse,
                        status: 'failed',
                        error: payload.error_message,
                    },
                });
                break;

            case 'completed': {
                // Chỉ check URL khi job đã xong
                const url = payload.url ?? payload.video_url;
                if (!url) {
                    this.logger.warn('AI model webhook missing url for completed event');
                    return { ignored: true, reason: 'missing_url' };
                }

                const jobId =
                    typeof payload.job_id === 'string' && payload.job_id.trim().length > 0
                        ? payload.job_id.trim()
                        : undefined;

                let videoId: number | undefined;
                if (jobId) {
                    const videoRow = await this.videoModel.findOne({
                        where: { job_id: jobId },
                    });

                    if (videoRow) {
                        videoId = videoRow.id;
                        completedVideoId = videoRow.id;
                    } else {
                        this.logger.warn(`AI model webhook completed event cannot find video by job_id=${jobId}`);
                    }
                } else {
                    this.logger.warn('AI model webhook completed event missing job_id');
                }

                // Bắn SSE báo hoàn thành (kèm srt_url nếu có)
                await this.notificationService.createAndEmit({
                    userId,
                    eventType: NotificationEventType.VIDEO_JOB_COMPLETED,
                    sseEventType: NotificationSseEventType.VIDEO_COMPLETED,
                    title: 'Video processing completed',
                    message: 'Your highlight video is ready',
                    sourceType: NotificationSourceType.VIDEO,
                    sourceId: videoId,
                    payload: {
                        videoId,
                        jobId,
                        url,
                        srtUrl: payload.srt_url,
                        type: typeForSse,
                        duration: payload.duration ?? undefined,
                        status: 'completed',
                    },
                });
                break;
            }

            default:
                this.logger.warn(`Unknown AI event type: ${eventType}`);
                break;
        }

        return { success: true, videoId: completedVideoId };
    }

    private async handleCloudinaryImage(params: {
        assetUrl: string;
        public_id?: string;
        format?: string;
        display_name?: string;
        original_filename?: string;
        custom?: CloudinaryContextCustom;
        userId: number;
        jobId?: string;
    }) {
        const {
            assetUrl,
            public_id,
            format,
            display_name,
            original_filename,
            userId,
            jobId,
        } = params;

        const resolvedName =
            original_filename?.trim() ||
            display_name?.trim() ||
            null;

        let row: Image;

        if (jobId) {
            const [img, created] = await this.imageModel.findOrCreate({
                where: { job_id: jobId },
                defaults: {
                    job_id: jobId,
                    user_id: userId,
                    url: assetUrl,
                    thumbnail: assetUrl,
                    public_id: public_id ?? null,
                    format: format ?? null,
                    name: resolvedName,
                },
            });

            row = img;

            if (!created) {
                await row.update({
                    user_id: userId,
                    url: assetUrl,
                    thumbnail: assetUrl,
                    public_id: public_id ?? row.public_id,
                    format: format ?? row.format,
                    ...(resolvedName ? { name: resolvedName } : {}),
                });
                this.logger.log(`Updated image row image_id=${row.image_id} job_id=${jobId}`);
            } else {
                this.logger.log(
                    `Created image row image_id=${row.image_id} job_id=${jobId} user_id=${userId}`,
                );
            }
        } else {
            row = await this.imageModel.create({
                job_id: null,
                user_id: userId,
                url: assetUrl,
                thumbnail: assetUrl,
                public_id: public_id ?? null,
                format: format ?? null,
                name: resolvedName,
            });
            this.logger.log(
                `Created direct-upload image row image_id=${row.image_id} user_id=${userId} (no job_id)`,
            );
        }

        await this.notificationService.createAndEmit({
            userId,
            eventType: NotificationEventType.IMAGE_UPLOAD_COMPLETED,
            sseEventType: NotificationSseEventType.UPLOAD_IMAGE_COMPLETED,
            title: 'Image upload completed',
            message: 'Your image has been uploaded successfully',
            sourceType: NotificationSourceType.IMAGE,
            sourceId: row.image_id,
            payload: {
                imageId: row.image_id,
                url: row.url,
                name: row.name,
                job_id: jobId,
            },
        });

        return { success: true, id: row.image_id };
    }
}
