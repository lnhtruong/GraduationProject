import {
    Injectable,
    Logger,
    BadRequestException,
    UnauthorizedException,
    InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { HttpService } from '@nestjs/axios';
import type { IncomingHttpHeaders } from 'http';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { Video, VideoType } from 'src/videos/video.model';
import { Image, MascotImageType } from 'src/images_mascot/images.model';
// import { WebsocketService } from 'src/websocket/websocket.service';
import { BunnyService } from 'src/bunny/bunny.service';
import { NotificationService } from 'src/notifications/notification.service';
import { SseService } from 'src/sse/sse.service';
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

type ColabQuizOption = {
    optionText: string;
    isCorrect: boolean;
    orderIndex: number;
};

type ColabQuizEvidenceLegacy = {
    text?: string;
    text_from_srt?: string;
    srt_indices?: number[];
    start_ms: number;
    end_ms: number;
};

/** Colab prompt mới + legacy map `{a,b,c,d}` — course_service `/quizzes/from-ai` nhận cả hai. */
type QuizQuestionPayload = {
    id?: number;
    type?: 'mcq' | 'true_false';
    question: string;
    options?: ColabQuizOption[] | Record<string, string>;
    correct?: 'a' | 'b' | 'c' | 'd';
    correct_index?: number;
    explanation?: string;
    evidence?: string | ColabQuizEvidenceLegacy;
    evidenceTimestamp?: string;
    videoTimestamp?: string | null;
    difficulty?: 'easy' | 'medium' | 'hard';
};

type QuizPayload = {
    questions: QuizQuestionPayload[];
    total?: number;
    model?: string;
};

type HighlightMultiVideoResult = {
    topic_id?: number | string;
    title?: string;
    description?: string;
    download_url?: string;
    srt_url?: string;
    duration?: number | string;
    [key: string]: unknown;
};

export interface ai_model_result {
    event?: 'stage_update' | 'job_progress' | 'completed' | 'job_failed'; // Thêm field này
    job_id?: string;
    jobId?: string;
    user_id?: string | number;
    userId?: string | number;
    type?: string;

    // Dành cho completed
    video_url?: string;
    url?: string;
    srt_url?: string;
    duration?: number;
    display_name?: string;
    source_original_filename?: string;
    videos?: HighlightMultiVideoResult[];

    // Dành cho quiz type=quiz
    quiz?: {
        questions: QuizQuestionPayload[];
        total?: number;
        model?: string;
    };
    questions?: QuizQuestionPayload[];
    result?: {
        quiz?: QuizPayload;
        questions?: QuizQuestionPayload[];
        model?: string;
        total?: number;
    };
    // Shared giữa subtitle + quiz:
    //   - subtitle: update `videos.srt_raw_url WHERE id=<video_id>`
    //   - quiz:     link quiz vào video + lesson_activity (course_service /quizzes/from-ai)
    video_id?: number | string;
    videoId?: number | string;
    lesson_activity_id?: number | string;
    lessonActivityId?: number | string;
    quiz_name?: string;
    quizName?: string;

    shuffleQuestion?: boolean;
    shuffleOption?: boolean;
    passingScore?: number;
    timeLimitMinutes?: number;
    isInVideo?: boolean;

    // Dành cho progress / failed
    stage?: string;
    stage_index?: number;
    total_stages?: number;
    status?: string;
    error_message?: string;
    errorMessage?: string;
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
        private readonly sseService: SseService,
        private readonly bunnyService: BunnyService,
        private readonly httpService: HttpService,
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

        const uploadContext = row.upload_context ?? {};
        const courseId = this.parsePositiveInt(uploadContext.courseId);
        const lessonId = this.parsePositiveInt(uploadContext.lessonId);
        const redirectUrl = courseId && lessonId
            ? `/instructor/courses/${courseId}/lessons/${lessonId}/edit`
            : courseId
                ? `/instructor/courses/${courseId}`
                : null;

        await this.notificationService.createAndEmit({
            userId: row.user_id,
            eventType: NotificationEventType.VIDEO_UPLOAD_COMPLETED,
            sseEventType: NotificationSseEventType.UPLOAD_VIDEO_COMPLETED,
            title: 'Tải video lên hoàn tất',
            message: 'Video bài học của bạn đã sẵn sàng sử dụng',
            sourceType: NotificationSourceType.VIDEO,
            sourceId: row.id,
            payload: {
                videoId: row.id,
                courseId: courseId ?? null,
                lessonId: lessonId ?? null,
                redirectUrl,
                url,
                thumbnailUrl: row.thumbnail ?? thumb ?? undefined,
                type: VideoType.LONG,
                duration: duration ?? undefined,
                name: row.name ?? undefined,
                purpose: typeof uploadContext.purpose === 'string' ? uploadContext.purpose : undefined,
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

    private resolveImageType(custom: CloudinaryContextCustom | undefined): MascotImageType {
        const rawType = custom?.type?.toLowerCase();
        if (rawType === MascotImageType.THUMBNAIL_COURSE) {
            return MascotImageType.THUMBNAIL_COURSE;
        }
        if (rawType === MascotImageType.AVT) {
            return MascotImageType.AVT;
        }
        if (rawType === MascotImageType.REPORT) {
            return MascotImageType.REPORT;
        }
        if (rawType === MascotImageType.ROLE_UPGRADE) {
            return MascotImageType.ROLE_UPGRADE;
        }
        if (rawType === MascotImageType.MASCOT) {
            return MascotImageType.MASCOT;
        }
        return MascotImageType.THUMBNAIL_VIDEO;
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

    private buildLibraryRedirectUrl(options?: {
        videoId?: number | null;
        type?: VideoType | string | null;
        imageId?: number | null;
        tab?: 'video' | 'mascot' | 'image';
    }): string {
        const params = new URLSearchParams();

        if (options?.videoId) {
            params.set('type', options.type === VideoType.MASCOT ? 'mascot' : 'video');
            params.set('videoId', String(options.videoId));
        } else if (options?.tab) {
            params.set('tab', options.tab);
        }

        if (options?.imageId) {
            params.set('imageId', String(options.imageId));
            if (!params.has('tab')) {
                params.set('tab', 'image');
            }
        }

        const query = params.toString();
        return query ? `/library?${query}` : '/library';
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

        if (jobId || type === VideoType.HIGHLIGHT) {
            return { success: true, id: row.id, notificationSkipped: true };
        }

        await this.notificationService.createAndEmit({
            userId,
            eventType: NotificationEventType.VIDEO_UPLOAD_COMPLETED,
            sseEventType: NotificationSseEventType.UPLOAD_VIDEO_COMPLETED,
            title: 'Tải video lên hoàn tất',
            message: 'Video của bạn đã được tải lên thành công',
            sourceType: NotificationSourceType.VIDEO,
            sourceId: row.id,
            payload: {
                videoId: row.id,
                url: row.url ?? '',
                thumbnailUrl: row.thumbnail,
                type: row.type,
                duration: duration ?? undefined,
                name: resolvedName ?? undefined,
                job_id: jobId,
                redirectUrl: this.buildLibraryRedirectUrl({ videoId: row.id, type: row.type }),
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

    private getHeader(headers: IncomingHttpHeaders, name: string): string | undefined {
        const value = headers[name.toLowerCase()];
        if (Array.isArray(value)) return value[0];
        return value;
    }

    /**
     * Verify the AI-model webhook bằng QStash native signature.
     *
     * QStash tự sign mọi message qua `Receiver.verify()` — chỉ cần:
     *   - rawBody (Buffer raw không qua JSON.parse)
     *   - signature header `upstash-signature` (JWT QStash tạo)
     *   - full URL của endpoint (QStash sign cả URL → chống replay sang URL khác)
     *
     * Env cần set:
     *   QSTASH_CURRENT_SIGNING_KEY=sig_xxx   (lấy từ Upstash console)
     *   QSTASH_NEXT_SIGNING_KEY=sig_yyy     (cho key rotation, optional)
     *   PUBLIC_WEBHOOK_URL=https://api.your-domain.com/api/media/webhooks/ai-model/result
     */
    async verifyAiWebhook(
        rawBody: Buffer | undefined,
        headers: IncomingHttpHeaders,
    ): Promise<void> {
        // Dev escape hatch — đặt QSTASH_SKIP_VERIFY=true để test qua Postman/curl.
        // KHÔNG bật ở production.
        if (process.env.QSTASH_SKIP_VERIFY === 'true') {
            this.logger.warn(
                '[ai-webhook] ⚠️  signature verification SKIPPED — only safe in dev',
            );
            return;
        }

        const currentKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
        const nextKey = process.env.QSTASH_NEXT_SIGNING_KEY ?? '';
        if (!currentKey) {
            throw new InternalServerErrorException(
                'QSTASH_CURRENT_SIGNING_KEY not configured',
            );
        }

        if (!rawBody || rawBody.length === 0) {
            throw new BadRequestException('Missing raw body for AI webhook verification');
        }

        const signature = this.getHeader(headers, 'upstash-signature');
        if (!signature) {
            throw new UnauthorizedException('Missing upstash-signature header');
        }

        const url =
            process.env.PUBLIC_WEBHOOK_URL ??
            'http://localhost:8003/webhooks/ai-model/result';

        // Lazy import để Jest test không cần load lib này
        const { Receiver } = await import('@upstash/qstash');
        const receiver = new Receiver({
            currentSigningKey: currentKey,
            nextSigningKey: nextKey,
        });

        try {
            await receiver.verify({
                signature,
                body: rawBody.toString('utf8'),
                url,
            });
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            this.logger.warn(`[ai-webhook] QStash verify failed: ${msg}`);
            throw new UnauthorizedException('Invalid QStash signature');
        }

        this.logger.log('[ai-webhook] verified via QStash signature');
    }

    private parsePositiveInt(value: unknown): number | undefined {
        if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
            return value;
        }
        if (typeof value === 'string' && value.trim().length > 0) {
            const parsed = Number(value);
            if (Number.isInteger(parsed) && parsed > 0) return parsed;
        }
        return undefined;
    }

    private parseJobId(payload: ai_model_result): string | undefined {
        const raw = payload.job_id ?? payload.jobId;
        return typeof raw === 'string' && raw.trim().length > 0 ? raw.trim() : undefined;
    }

    private normalizeQuizQuestions(
        questions: QuizQuestionPayload[],
        isInVideo: boolean,
    ): QuizQuestionPayload[] {
        return questions.map((q) => {
            const normalized: QuizQuestionPayload = {
                id: q.id,
                type: q.type,
                question: q.question,
                explanation: q.explanation,
                difficulty: q.difficulty,
                correct_index: q.correct_index,
            };

            if (Array.isArray(q.options)) {
                normalized.options = q.options.map((opt, idx) => ({
                    optionText: String(opt.optionText ?? ''),
                    isCorrect: Boolean(opt.isCorrect),
                    orderIndex:
                        typeof opt.orderIndex === 'number' && opt.orderIndex > 0
                            ? opt.orderIndex
                            : idx + 1,
                }));
            } else if (q.options && typeof q.options === 'object') {
                normalized.options = q.options;
                normalized.correct = q.correct;
            }

            if (isInVideo) {
                if (typeof q.evidenceTimestamp === 'string') {
                    normalized.evidenceTimestamp = q.evidenceTimestamp.trim();
                } else if (typeof q.videoTimestamp === 'string') {
                    normalized.evidenceTimestamp = q.videoTimestamp.trim();
                }

                if (typeof q.evidence === 'string') {
                    normalized.evidence = q.evidence.trim();
                } else if (q.evidence && typeof q.evidence === 'object') {
                    normalized.evidence = q.evidence;
                }
            }

            return normalized;
        });
    }

    private extractQuizPayload(payload: ai_model_result): QuizPayload | undefined {
        if (payload.quiz?.questions?.length) {
            return payload.quiz;
        }

        if (payload.questions?.length) {
            return {
                questions: payload.questions,
                model: payload.result?.model,
                total: payload.result?.total,
            };
        }

        if (payload.result?.quiz?.questions?.length) {
            return payload.result.quiz;
        }

        if (payload.result?.questions?.length) {
            return {
                questions: payload.result.questions,
                model: payload.result.model,
                total: payload.result.total,
            };
        }

        return undefined;
    }

    private normalizeText(value: unknown): string | undefined {
        return typeof value === 'string' && value.trim().length > 0
            ? value.trim()
            : undefined;
    }

    private buildCloudinaryVideoThumbnailUrl(assetUrl: string): string | undefined {
        try {
            const url = new URL(assetUrl);
            if (!url.pathname.includes('/video/upload/')) {
                return undefined;
            }

            url.pathname = url.pathname
                .replace('/video/upload/', '/video/upload/so_1/')
                .replace(/\.[^/.]+$/, '.jpg');
            return url.toString();
        } catch {
            return undefined;
        }
    }

    private buildHighlightMultiJobId(jobId: string | undefined, topicId: number | undefined) {
        if (!jobId || !topicId) {
            return null;
        }
        return `${jobId}:highlight-multi:${topicId}`;
    }

    private async handleHighlightMultiCompleted(params: {
        payload: ai_model_result;
        userId: number;
        jobId?: string;
    }) {
        const { payload, userId, jobId } = params;
        const videos = Array.isArray(payload.videos) ? payload.videos : [];

        if (!videos.length) {
            this.logger.warn('highlight-multi completed missing videos[]');
            return { ignored: true, reason: 'missing_videos' };
        }

        const createdVideos: Array<{
            videoId: number;
            topicId?: number;
            title?: string;
            url: string;
            thumbnailUrl?: string;
            srtUrl?: string;
            duration?: number;
        }> = [];

        for (const [index, video] of videos.entries()) {
            const url = this.normalizeText(video.download_url);
            if (!url) {
                this.logger.warn(
                    `highlight-multi video index=${index} missing download_url`,
                );
                continue;
            }

            const topicId =
                this.parsePositiveInt(video.topic_id) ?? index + 1;
            const derivedJobId = this.buildHighlightMultiJobId(jobId, topicId);
            const title =
                this.normalizeText(video.title) ??
                `${payload.source_original_filename ?? jobId ?? 'highlight'} - topic ${topicId}`;
            const srtUrl = this.normalizeText(video.srt_url) ?? payload.srt_url ?? null;
            const durationRaw = Number(video.duration);
            const duration =
                Number.isFinite(durationRaw) && durationRaw > 0 ? durationRaw : null;
            const thumbnail =
                this.buildCloudinaryVideoThumbnailUrl(url) ??
                'https://placehold.co/320x180/png?text=thumbnail';

            let row: Video;
            if (derivedJobId) {
                const [found] = await this.videoModel.findOrCreate({
                    where: { job_id: derivedJobId },
                    defaults: {
                        job_id: derivedJobId,
                        user_id: userId,
                        type: VideoType.HIGHLIGHT,
                        url,
                        duration,
                        name: title,
                        thumbnail,
                        srt_raw_url: srtUrl,
                        upload_context: {
                            sourceJobId: jobId,
                            topicId,
                            description: this.normalizeText(video.description) ?? null,
                            sourceOriginalFilename: payload.source_original_filename ?? null,
                            type: 'highlight-multi',
                        },
                    },
                });
                row = found;
                await row.update({
                    user_id: userId,
                    type: VideoType.HIGHLIGHT,
                    url,
                    duration: duration ?? row.duration,
                    name: title,
                    thumbnail,
                    srt_raw_url: srtUrl,
                    upload_context: {
                        ...(row.upload_context ?? {}),
                        sourceJobId: jobId,
                        topicId,
                        description: this.normalizeText(video.description) ?? null,
                        sourceOriginalFilename: payload.source_original_filename ?? null,
                        type: 'highlight-multi',
                    },
                });
            } else {
                row = await this.videoModel.create({
                    job_id: null,
                    user_id: userId,
                    type: VideoType.HIGHLIGHT,
                    url,
                    duration,
                    name: title,
                    thumbnail,
                    srt_raw_url: srtUrl,
                    upload_context: {
                        topicId,
                        description: this.normalizeText(video.description) ?? null,
                        sourceOriginalFilename: payload.source_original_filename ?? null,
                        type: 'highlight-multi',
                    },
                });
            }

            createdVideos.push({
                videoId: row.id,
                topicId,
                title,
                url,
                thumbnailUrl: row.thumbnail,
                srtUrl: srtUrl ?? undefined,
                duration: duration ?? undefined,
            });
        }

        if (!createdVideos.length) {
            return { ignored: true, reason: 'no_valid_videos' };
        }

        await this.notificationService.createAndEmit({
            userId,
            eventType: NotificationEventType.VIDEO_JOB_COMPLETED,
            sseEventType: NotificationSseEventType.VIDEO_COMPLETED,
            title: 'Tạo video highlight hoàn tất',
            message: `${createdVideos.length} video highlight đã sẵn sàng`,
            sourceType: NotificationSourceType.VIDEO_JOB,
            sourceId: createdVideos[0]?.videoId,
            payload: {
                jobId,
                type: 'highlight-multi',
                status: 'completed',
                videos,
                createdVideos,
                videoIds: createdVideos.map((video) => video.videoId),
                thumbnailUrl: createdVideos[0]?.thumbnailUrl,
                srtUrl: payload.srt_url,
                sourceOriginalFilename: payload.source_original_filename,
                redirectUrl: this.buildLibraryRedirectUrl({ videoId: createdVideos[0]?.videoId, type: VideoType.HIGHLIGHT }),
            },
        });

        return {
            success: true,
            videoIds: createdVideos.map((video) => video.videoId),
        };
    }

    /**
     * `type: "highlight_edit"` completed event (feature 003-highlight-segment-removal).
     * Unlike every other completed-event branch, this NEVER creates a row — an edit
     * always targets a pre-existing highlight, resolved strictly by `payload.video_id`
     * (mirrors the `subtitle` type's video_id-first resolution). Clears `editing_job_id`
     * so the video becomes editable again (repeatable editing, FR-007).
     */
    private async handleHighlightEditCompleted(params: {
        payload: ai_model_result;
        userId: number;
    }) {
        const { payload, userId } = params;

        const videoId = this.parsePositiveInt(payload.video_id ?? payload.videoId);
        if (!videoId) {
            this.logger.warn('highlight_edit completed missing video_id');
            return { ignored: true, reason: 'missing_video_id' };
        }

        const url = payload.url ?? payload.video_url;
        if (!url) {
            this.logger.warn('highlight_edit completed missing url');
            return { ignored: true, reason: 'missing_url' };
        }

        const row = await this.videoModel.findByPk(videoId);
        if (!row) {
            this.logger.warn(`highlight_edit completed: video_id=${videoId} không tồn tại`);
            return { ignored: true, reason: 'video_not_found' };
        }
        if (row.user_id !== userId) {
            this.logger.warn(
                `highlight_edit completed: video_id=${videoId} thuộc user khác (${row.user_id} vs ${userId}) — reject`,
            );
            return { ignored: true, reason: 'video_id_user_mismatch' };
        }

        await row.update({
            url,
            duration: typeof payload.duration === 'number' ? payload.duration : row.duration,
            srt_raw_url: payload.srt_url ?? row.srt_raw_url,
            editing_job_id: null,
        });

        await this.notificationService.createAndEmit({
            userId,
            eventType: NotificationEventType.HIGHLIGHT_EDIT_COMPLETED,
            sseEventType: NotificationSseEventType.VIDEO_COMPLETED,
            title: 'Chỉnh sửa highlight hoàn tất',
            message: 'Highlight của bạn đã được cập nhật',
            sourceType: NotificationSourceType.VIDEO,
            sourceId: row.id,
            payload: {
                videoId: row.id,
                url: row.url,
                duration: row.duration,
                type: 'highlight_edit',
                status: 'completed',
                redirectUrl: this.buildLibraryRedirectUrl({ videoId: row.id, type: VideoType.HIGHLIGHT }),
            },
        });

        return { success: true, id: row.id };
    }

    async handleAIResult(payload: ai_model_result) {

        console.log('handleHighlightMultiCompleted', payload);


        // 1. Xử lý User ID trước (logic cũ của bạn)
        const userIdRaw = payload.user_id ?? payload.userId;
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
        const type: VideoType | 'quiz' | 'highlight-multi' | undefined =
            rawType === VideoType.MASCOT ? VideoType.MASCOT
                : rawType === VideoType.HIGHLIGHT ? VideoType.HIGHLIGHT
                    : rawType === VideoType.LONG ? VideoType.LONG
                        : rawType === 'quiz' ? 'quiz'
                            : rawType === 'highlight-multi' ? 'highlight-multi'
                                : undefined;
        const typeForSse = type ?? rawType ?? 'unknown';

        let completedVideoId: number | undefined;

        // 3. Phân luồng xử lý theo EVENT
        // Mặc định là 'completed' nếu Python chưa kịp update code cũ
        const eventType =
            payload.event === 'job_progress'
                ? 'stage_update'
                : payload.event || 'completed';

        switch (eventType) {
            case 'stage_update':
                // Bắn SSE báo progress cho FE
                await this.notificationService.createAndEmit({
                    userId,
                    eventType: NotificationEventType.VIDEO_JOB_PROGRESS,
                    sseEventType: NotificationSseEventType.VIDEO_PROGRESS,
                    title: 'Cập nhật xử lý video',
                    message: 'Video của bạn đang được xử lý',
                    sourceType: NotificationSourceType.VIDEO_JOB,
                    payload: {
                        jobId: this.parseJobId(payload),
                        type: typeForSse,
                        stage: payload.stage,
                        stageIndex: payload.stage_index,
                        totalStages: payload.total_stages,
                        status: 'processing',
                    },
                });
                break;

            case 'job_failed':
                // highlight_edit: clear editing_job_id so the video becomes
                // editable again — the generic failure notification below still
                // fires, but this type never touches url/duration/srt_raw_url
                // (FR-010: the previous video must stay unchanged on failure).
                if (rawType === 'highlight_edit') {
                    const failedVideoId = this.parsePositiveInt(payload.video_id ?? payload.videoId);
                    if (failedVideoId) {
                        const row = await this.videoModel.findByPk(failedVideoId);
                        if (row && row.user_id === userId) {
                            await row.update({ editing_job_id: null });
                        }
                    }
                }
                // Bắn SSE báo lỗi
                await this.notificationService.createAndEmit({
                    userId,
                    eventType: NotificationEventType.VIDEO_JOB_FAILED,
                    sseEventType: NotificationSseEventType.VIDEO_ERROR,
                    title: 'Xử lý video thất bại',
                    message: payload.error_message ?? payload.errorMessage ?? 'Đã xảy ra lỗi khi xử lý video',
                    sourceType: NotificationSourceType.VIDEO_JOB,
                    payload: {
                        success: false,
                        jobId: this.parseJobId(payload),
                        type: typeForSse,
                        status: 'failed',
                        error: payload.error_message ?? payload.errorMessage,
                    },
                });
                break;

            case 'completed': {
                const jobId = this.parseJobId(payload);

                // ---- TYPE = subtitle (transcribe job) -----------------------
                if (rawType === 'subtitle') {
                    const srtUrl = payload.srt_url;
                    if (!srtUrl) {
                        this.logger.warn('subtitle completed missing srt_url');
                        return { ignored: true, reason: 'missing_srt_url' };
                    }

                    // Resolve video row theo thứ tự ưu tiên:
                    //   1. `payload.video_id` (FE truyền khi đã có row từ Bunny upload)
                    //      → update đúng row đó, không tạo orphan
                    //   2. `payload.job_id` → findOrCreate by job_id (legacy / standalone transcribe)
                    let row: Video | null = null;
                    const videoIdFromPayload = this.parsePositiveInt(payload.video_id ?? payload.videoId);

                    if (typeof videoIdFromPayload === 'number' && videoIdFromPayload > 0) {
                        row = await this.videoModel.findByPk(videoIdFromPayload);
                        if (!row) {
                            this.logger.warn(
                                `subtitle webhook: video_id=${videoIdFromPayload} không tồn tại — fallback theo job_id`,
                            );
                        } else if (row.user_id !== userId) {
                            // An ninh: chống FE gửi nhầm video_id của user khác
                            this.logger.warn(
                                `subtitle webhook: video_id=${videoIdFromPayload} thuộc user khác (${row.user_id} vs ${userId}) — reject`,
                            );
                            return { ignored: true, reason: 'video_id_user_mismatch' };
                        } else {
                            await row.update({ srt_raw_url: srtUrl });
                        }
                    }

                    // Fallback: nếu không có video_id hoặc lookup fail → findOrCreate by job_id
                    if (!row && jobId) {
                        const [created] = await this.videoModel.findOrCreate({
                            where: { job_id: jobId },
                            defaults: {
                                job_id: jobId,
                                user_id: userId,
                                type: VideoType.HIGHLIGHT,
                                url: null,
                                duration: null,
                                thumbnail: 'https://placehold.co/320x180/png?text=thumbnail',
                                srt_raw_url: srtUrl,
                            },
                        });
                        row = created;
                        if (row.srt_raw_url !== srtUrl) {
                            await row.update({ srt_raw_url: srtUrl });
                        }
                    }

                    if (row) {
                        completedVideoId = row.id;
                    }

                    await this.notificationService.createAndEmit({
                        userId,
                        eventType: NotificationEventType.TRANSCRIBE_COMPLETED,
                        sseEventType: NotificationSseEventType.TRANSCRIBE_COMPLETED,
                        title: 'Tạo phụ đề hoàn tất',
                        message: 'Phụ đề video của bạn đã sẵn sàng',
                        sourceType: NotificationSourceType.VIDEO_JOB,
                        sourceId: completedVideoId,
                        payload: {
                            videoId: completedVideoId,
                            jobId,
                            srtUrl,
                            thumbnailUrl: row?.thumbnail,
                            type: 'subtitle',
                            sourceOriginalFilename: payload.source_original_filename,
                            status: 'completed',
                            redirectUrl: this.buildLibraryRedirectUrl({ videoId: completedVideoId, type: VideoType.HIGHLIGHT }),
                        },
                    });
                    break;
                }

                // ---- TYPE = quiz (quiz generation job) ----------------------
                if (rawType === 'quiz') {
                    const quiz = this.extractQuizPayload(payload);
                    if (!quiz?.questions?.length) {
                        this.logger.warn('quiz completed missing questions[]');
                        return { ignored: true, reason: 'missing_quiz_questions' };
                    }
                    const lessonActivityId = this.parsePositiveInt(
                        payload.lesson_activity_id ?? payload.lessonActivityId,
                    );
                    const videoIdFromPayload = this.parsePositiveInt(payload.video_id ?? payload.videoId);
                    if (!lessonActivityId || !videoIdFromPayload) {
                        this.logger.warn('quiz completed missing lesson_activity_id/video_id');
                        return { ignored: true, reason: 'missing_quiz_metadata' };
                    }

                    if (payload.srt_url) {
                        const videoRow = await this.videoModel.findByPk(videoIdFromPayload);
                        if (!videoRow) {
                            this.logger.warn(`quiz webhook: video_id=${videoIdFromPayload} not found`);
                            return { ignored: true, reason: 'video_not_found' };
                        }
                        if (videoRow.user_id !== userId) {
                            this.logger.warn(
                                `quiz webhook: video_id=${videoIdFromPayload} user mismatch (${videoRow.user_id} vs ${userId})`,
                            );
                            return { ignored: true, reason: 'video_id_user_mismatch' };
                        }
                        if (videoRow.srt_raw_url !== payload.srt_url) {
                            await videoRow.update({ srt_raw_url: payload.srt_url });
                        }
                    }

                    // Forward quiz → course_service POST /quizzes/from-ai
                    const courseUrl = (process.env.COURSE_SERVICE_URL ?? 'http://localhost:8008')
                        .trim()
                        .replace(/\/+$/, '');
                    const quizName =
                        payload.quiz_name?.trim() ||
                        payload.quizName?.trim() ||
                        `AI Quiz - ${payload.source_original_filename ?? jobId ?? 'unnamed'}`;
                    const isInVideo = payload.isInVideo ?? true;
                    const normalizedQuestions = this.normalizeQuizQuestions(quiz.questions, isInVideo);
                    try {
                        const resp = await firstValueFrom(
                            this.httpService.post<{ id?: number; lessonActivityId?: number }>(
                                `${courseUrl}/quizzes/from-ai`,
                                {
                                    lessonActivityId,
                                    videoId: videoIdFromPayload,
                                    name: quizName,
                                    jobId,
                                    model: quiz.model,
                                    questions: normalizedQuestions,
                                    isInVideo,
                                    shuffleQuestion: payload.shuffleQuestion ?? false,
                                    shuffleOption: payload.shuffleOption ?? false,
                                    passingScore: payload.passingScore ?? 0,
                                    timeLimitMinutes: payload.timeLimitMinutes ?? 0,
                                },
                                {
                                    headers: { 'x-user-id': String(userId) },
                                    timeout: 30000,
                                },
                            ),
                        );
                        const createdQuiz = (resp as {
                            data: {
                                id?: number;
                                lessonActivityId?: number;
                                lessonId?: number | null;
                                courseId?: number | null;
                                redirectUrl?: string | null;
                            };
                        }).data;
                        await this.notificationService.createAndEmit({
                            userId,
                            eventType: NotificationEventType.QUIZ_GENERATED,
                            sseEventType: NotificationSseEventType.QUIZ_GENERATED,
                            title: 'Tạo quiz hoàn tất',
                            message: `Đã tạo xong ${quiz.questions.length} câu hỏi. Vui lòng xem lại trước khi lưu quiz.`,
                            sourceType: NotificationSourceType.VIDEO_JOB,
                            payload: {
                                jobId,
                                quizId: createdQuiz.id,
                                lessonActivityId: createdQuiz.lessonActivityId ?? lessonActivityId,
                                lessonId: createdQuiz.lessonId ?? null,
                                courseId: createdQuiz.courseId ?? null,
                                redirectUrl: createdQuiz.redirectUrl ?? null,
                                videoId: videoIdFromPayload,
                                questionCount: quiz.questions.length,
                                type: 'quiz',
                                status: 'completed',
                            },
                        });
                        return { ok: true, quizId: createdQuiz.id };
                    } catch (err) {
                        const ae = err as AxiosError;
                        const detail = ae.response?.data ?? ae.message;
                        this.logger.error(
                            `Forward quiz to course_service failed: ${JSON.stringify(detail)}`,
                        );
                        await this.notificationService.createAndEmit({
                            userId,
                            eventType: NotificationEventType.VIDEO_JOB_FAILED,
                            sseEventType: NotificationSseEventType.VIDEO_ERROR,
                            title: 'Lưu quiz thất bại',
                            message: 'Không thể chuẩn bị quiz AI để xem lại',
                            sourceType: NotificationSourceType.VIDEO_JOB,
                            payload: {
                                jobId, type: 'quiz', status: 'failed',
                                error: typeof detail === 'string' ? detail : JSON.stringify(detail),
                            },
                        });
                        throw new InternalServerErrorException('forward_quiz_failed');
                    }
                }

                // ---- TYPE = highlight | mascot | long (logic cũ) ------------
                if (rawType === 'highlight-multi') {
                    return this.handleHighlightMultiCompleted({
                        payload,
                        userId,
                        jobId,
                    });
                }

                if (rawType === 'highlight_edit') {
                    return this.handleHighlightEditCompleted({ payload, userId });
                }

                const url = payload.url ?? payload.video_url;
                if (!url) {
                    this.logger.warn('AI model webhook missing url for completed event');
                    return { ignored: true, reason: 'missing_url' };
                }

                const completedVideoType =
                    type === VideoType.MASCOT || type === VideoType.HIGHLIGHT || type === VideoType.LONG
                        ? type
                        : VideoType.HIGHLIGHT;
                const completedVideoLabel =
                    completedVideoType === VideoType.MASCOT ? 'mascot' : 'highlight';

                let videoId: number | undefined;
                let thumbnailUrl: string | undefined;
                if (jobId) {
                    let videoRow = await this.videoModel.findOne({
                        where: { job_id: jobId },
                    });
                    if (!videoRow) {
                        const thumbnail =
                            this.buildCloudinaryVideoThumbnailUrl(url) ??
                            'https://placehold.co/320x180/png?text=thumbnail';
                        // original_video_id: only meaningful for single-output highlights —
                        // this is the SOLE mechanism enforcing FR-008 (segment-removal
                        // eligibility is single-output-only, spec 003-highlight-segment-removal).
                        // Do NOT thread `payload.video_id` into `handleHighlightMultiCompleted`'s
                        // row-creation — a multi-output row having original_video_id set would
                        // silently make it edit-eligible with no other guard in place.
                        const originalVideoId =
                            completedVideoType === VideoType.HIGHLIGHT
                                ? this.parsePositiveInt(payload.video_id)
                                : null;
                        videoRow = await this.videoModel.create({
                            job_id: jobId,
                            user_id: userId,
                            type: completedVideoType,
                            url,
                            duration: typeof payload.duration === 'number' ? payload.duration : null,
                            name:
                                payload.source_original_filename ??
                                `${jobId}_${completedVideoLabel}.mp4`,
                            thumbnail,
                            srt_raw_url: payload.srt_url ?? null,
                            original_video_id: originalVideoId ?? null,
                            upload_context: {
                                sourceOriginalFilename: payload.source_original_filename ?? null,
                                type: typeForSse,
                            },
                        });
                        this.logger.log(`Created video row id=${videoRow.id} from AI completed job_id=${jobId}`);
                    } else {
                        const thumbnail = this.buildCloudinaryVideoThumbnailUrl(url);
                        const originalVideoId =
                            completedVideoType === VideoType.HIGHLIGHT
                                ? this.parsePositiveInt(payload.video_id)
                                : null;
                        await videoRow.update({
                            user_id: userId,
                            type: completedVideoType,
                            url,
                            duration:
                                typeof payload.duration === 'number'
                                    ? payload.duration
                                    : videoRow.duration,
                            ...(payload.source_original_filename
                                ? { name: payload.source_original_filename }
                                : {}),
                            ...(thumbnail ? { thumbnail } : {}),
                            srt_raw_url: payload.srt_url ?? videoRow.srt_raw_url,
                            original_video_id: originalVideoId ?? videoRow.original_video_id,
                        });
                    }
                    videoId = videoRow.id;
                    thumbnailUrl = videoRow.thumbnail;
                    completedVideoId = videoRow.id;
                } else {
                    this.logger.warn('AI model webhook completed event missing job_id');
                }

                await this.notificationService.createAndEmit({
                    userId,
                    eventType: NotificationEventType.VIDEO_JOB_COMPLETED,
                    sseEventType: NotificationSseEventType.VIDEO_COMPLETED,
                    title: 'Xử lý video hoàn tất',
                    message: `Video ${completedVideoLabel} của bạn đã sẵn sàng`,
                    sourceType: NotificationSourceType.VIDEO,
                    sourceId: videoId,
                    payload: {
                        videoId,
                        jobId,
                        url,
                        thumbnailUrl,
                        srtUrl: payload.srt_url,
                        type: typeForSse,
                        duration: payload.duration ?? undefined,
                        status: 'completed',
                        redirectUrl: this.buildLibraryRedirectUrl({ videoId, type: completedVideoType }),
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
            custom,
            userId,
            jobId,
        } = params;

        const imageType = this.resolveImageType(custom);
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
                    type: imageType,
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
                    type: imageType,
                });
                this.logger.log(`Updated image row image_id=${row.image_id} job_id=${jobId} type=${imageType}`);
            } else {
                this.logger.log(
                    `Created image row image_id=${row.image_id} job_id=${jobId} user_id=${userId} type=${imageType}`,
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
                type: imageType,
            });
            this.logger.log(
                `Created direct-upload image row image_id=${row.image_id} user_id=${userId} type=${imageType} (no job_id)`,
            );
        }

        if (imageType !== MascotImageType.MASCOT) {
            this.sseService.emitToUser(userId, {
                type: NotificationSseEventType.UPLOAD_IMAGE_COMPLETED,
                data: {
                    success: true,
                    data: {
                        imageId: row.image_id,
                        url: row.url,
                        name: row.name,
                        type: row.type,
                        job_id: jobId,
                    },
                    timestamp: new Date().toISOString(),
                },
            });

            return { success: true, id: row.image_id, notificationSkipped: true };
        }

        await this.notificationService.createAndEmit({
            userId,
            eventType: NotificationEventType.IMAGE_UPLOAD_COMPLETED,
            sseEventType: NotificationSseEventType.UPLOAD_IMAGE_COMPLETED,
            title: 'Tải ảnh lên hoàn tất',
            message: 'Ảnh của bạn đã được tải lên thành công',
            sourceType: NotificationSourceType.IMAGE,
            sourceId: row.image_id,
            payload: {
                imageId: row.image_id,
                url: row.url,
                name: row.name,
                type: row.type,
                job_id: jobId,
                redirectUrl: this.buildLibraryRedirectUrl({ imageId: row.image_id, tab: 'image' }),
            },
        });

        return { success: true, id: row.image_id };
    }
}
