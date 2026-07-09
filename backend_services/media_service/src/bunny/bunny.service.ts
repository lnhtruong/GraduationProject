import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import axios from 'axios';
import type { IncomingHttpHeaders } from 'http';
import { createHash, createHmac, timingSafeEqual } from 'crypto';
import { Video, VideoType } from 'src/videos/video.model';

type InitUploadBody = {
  /** Owner user for the `videos` row (required to persist long-video upload). */
  title?: string;
  collectionId?: string;
  thumbnailTime?: number;
  expiresInSeconds?: number;
  meta?: Record<string, unknown>;
};

type VideoUploadContext = {
  courseId?: number;
  lessonId?: number;
  purpose?: string;
};

@Injectable()
export class BunnyService {
  private readonly apiBase = 'https://video.bunnycdn.com';
  private readonly defaultCdnBaseUrl = 'https://vz-e0f2a12f-935.b-cdn.net';

  constructor(
    @InjectModel(Video)
    private readonly videoModel: typeof Video,
  ) { }

  private getConfig() {
    const libraryId = process.env.BUNNY_STREAM_LIBRARY_ID;
    const streamApiKey = process.env.BUNNY_STREAM_API_KEY;
    const readOnlyApiKey = process.env.BUNNY_STREAM_READ_ONLY_API_KEY;

    if (!libraryId || !streamApiKey || !readOnlyApiKey) {
      throw new InternalServerErrorException(
        'Missing Bunny env vars: BUNNY_STREAM_LIBRARY_ID, BUNNY_STREAM_API_KEY, BUNNY_STREAM_READ_ONLY_API_KEY',
      );
    }

    return { libraryId, streamApiKey, readOnlyApiKey };
  }

  private buildTusSignature(
    libraryId: string,
    videoId: string,
    expiresAt: number,
    streamApiKey: string,
  ) {
    return createHash('sha256')
      .update(`${libraryId}${streamApiKey}${expiresAt}${videoId}`)
      .digest('hex');
  }

  private getCdnBaseUrl() {
    return (process.env.BUNNY_STREAM_CDN_BASE_URL?.trim() || this.defaultCdnBaseUrl)
      .replace(/\/+$/, '');
  }

  private buildOriginalVideoUrl(videoId: string) {
    return `${this.getCdnBaseUrl()}/${encodeURIComponent(videoId)}/original`;
  }

  private parsePositiveInt(value: unknown): number | undefined {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
  }

  private buildUploadContext(meta?: Record<string, unknown>): VideoUploadContext | null {
    if (!meta || typeof meta !== 'object') {
      return null;
    }

    const courseId = this.parsePositiveInt(meta.courseId);
    const lessonId = this.parsePositiveInt(meta.lessonId);
    const purpose = typeof meta.purpose === 'string' && meta.purpose.trim()
      ? meta.purpose.trim()
      : undefined;

    if (!courseId && !lessonId && !purpose) {
      return null;
    }

    return {
      ...(courseId ? { courseId } : {}),
      ...(lessonId ? { lessonId } : {}),
      ...(purpose ? { purpose } : {}),
    };
  }

  async initUpload(body: InitUploadBody, userId: number | undefined) {
    if (!userId) {
      throw new BadRequestException('Missing userId');
    }
    const { libraryId, streamApiKey } = this.getConfig();
    const title = typeof body?.title === 'string' && body.title.trim().length > 0
      ? body.title.trim()
      : `video-${Date.now()}`;


    try {
      const createVideoResponse = await axios.post(
        `${this.apiBase}/library/${libraryId}/videos`,
        {
          title,
          collectionId: body?.collectionId,
          thumbnailTime: body?.thumbnailTime,
          meta: body?.meta,
        },
        {
          headers: {
            AccessKey: streamApiKey,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        },
      );

      const bunnyVideoId = createVideoResponse.data?.guid;
      if (!bunnyVideoId) {
        throw new InternalServerErrorException('Bunny did not return a valid video guid');
      }

      const initialVideoUrl = this.buildOriginalVideoUrl(bunnyVideoId);
      const uploadContext = this.buildUploadContext(body?.meta);
      const videoRow = await this.videoModel.create({
        user_id: userId,
        type: VideoType.LONG,
        bunny_video_guid: bunnyVideoId,
        url: initialVideoUrl,
        name: title,
        duration: null,
        thumbnail: 'https://placehold.co/320x180/png?text=processing',
        srt_raw_url: null,
        upload_context: uploadContext,
        job_id: null,
        image_id: null,
      });

      const expiresAt =
        Math.floor(Date.now() / 1000) + (body?.expiresInSeconds ?? 60 * 30);

      return {
        success: true,
        videoId: videoRow.id,
        bunnyVideoId,
        url: initialVideoUrl,
        // originalUrl: initialVideoUrl,
        libraryId,
        tus: {
          endpoint: `${this.apiBase}/tusupload`,
          headers: {
            AuthorizationSignature: this.buildTusSignature(
              libraryId,
              bunnyVideoId,
              expiresAt,
              streamApiKey,
            ),
            AuthorizationExpire: expiresAt.toString(),
            LibraryId: libraryId,
            VideoId: bunnyVideoId,
          },
        },
        bunnyVideo: createVideoResponse.data,
      };
    } catch (error: any) {
      const bunnyError = error?.response?.data;
      throw new BadRequestException(
        bunnyError?.message || bunnyError || error?.message || 'Failed to init Bunny upload',
      );
    }
  }

  async getVideoStatus(videoId: string) {
    const { libraryId, streamApiKey } = this.getConfig();
    try {
      const response = await axios.get(
        `${this.apiBase}/library/${libraryId}/videos/${videoId}`,
        {
          headers: {
            AccessKey: streamApiKey,
            Accept: 'application/json',
          },
        },
      );
      return response.data;
    } catch (error: any) {
      const bunnyError = error?.response?.data;
      throw new BadRequestException(
        bunnyError?.message || bunnyError || error?.message || 'Failed to get Bunny video status',
      );
    }
  }

  async getPlayData(videoId: string) {
    const { libraryId, streamApiKey } = this.getConfig();
    try {
      const response = await axios.get(
        `${this.apiBase}/library/${libraryId}/videos/${videoId}/play`,
        {
          headers: {
            AccessKey: streamApiKey,
            Accept: 'application/json',
          },
        },
      );
      return response.data;
    } catch (error: any) {
      const bunnyError = error?.response?.data;
      throw new BadRequestException(
        bunnyError?.message || bunnyError || error?.message || 'Failed to get Bunny play data',
      );
    }
  }

  /**
   * Bunny Stream signs the **exact raw request body** with HMAC-SHA256 using the library Read-Only API key.
   */
  verifyBunnyStreamWebhook(
    rawBody: Buffer | undefined,
    headers: IncomingHttpHeaders,
  ): void {
    const { readOnlyApiKey } = this.getConfig();

    if (!rawBody || rawBody.length === 0) {
      throw new BadRequestException('Missing raw body for Bunny webhook verification');
    }

    const signature = this.getHeader(headers, 'x-bunnystream-signature');
    const version = this.getHeader(headers, 'x-bunnystream-signature-version');
    const algorithm = this.getHeader(headers, 'x-bunnystream-signature-algorithm');

    if (!signature) {
      throw new UnauthorizedException('Missing X-BunnyStream-Signature');
    }

    if (version && version !== 'v1') {
      throw new UnauthorizedException('Unsupported Bunny signature version');
    }
    if (algorithm && algorithm !== 'hmac-sha256') {
      throw new UnauthorizedException('Unsupported Bunny signature algorithm');
    }

    const expected = createHmac('sha256', readOnlyApiKey).update(rawBody).digest('hex');

    const sigBuf = Buffer.from(signature, 'utf8');
    const expBuf = Buffer.from(expected, 'utf8');
    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
      throw new UnauthorizedException('Invalid Bunny webhook signature');
    }
  }

  private getHeader(headers: IncomingHttpHeaders, name: string): string | undefined {
    const lower = name.toLowerCase();
    const direct =
      headers[name] ??
      headers[lower] ??
      (headers as Record<string, string | string[] | undefined>)[lower];
    if (Array.isArray(direct)) return direct[0];
    return direct;
  }
}
