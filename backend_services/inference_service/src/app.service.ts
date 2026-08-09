import {
  Inject,
  Injectable,
  HttpException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import FormData from 'form-data';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import type { Response } from 'express';
import type { Readable } from 'stream';

import { ColabPoolService } from './colab/colab-pool.service';
import { JobRegistryService } from './colab/job-registry.service';
import { HIGHLIGHT_COLAB_POOL, MASCOT_COLAB_POOL } from './colab/colab.module';
import { ColabConfig } from './config/colab.config';
import {
  QuotaService,
  type QuotaContext,
  type QuotaSnapshot,
} from './quota/quota.service';
import { MediaClientService } from './media/media-client.service';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getStringField(obj: unknown, key: string): string | undefined {
  if (!isRecord(obj)) return undefined;
  const v = obj[key];
  return typeof v === 'string' ? v : undefined;
}

function getFormField(obj: unknown, key: string): string | undefined {
  if (!isRecord(obj)) return undefined;
  const v = obj[key];
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  return undefined;
}

function appendMascotField(
  formData: FormData,
  body: unknown,
  key: string,
  defaultValue?: string,
): void {
  const value = getFormField(body, key);
  const normalized =
    value === undefined || value.trim().length === 0 ? defaultValue : value;
  if (normalized !== undefined) formData.append(key, normalized);
}

/** Trạng thái Colab coi là job đã chết, khớp danh sách FE đang dùng. */
const FAILED_JOB_STATUSES = ['failed', 'error', 'cancelled', 'canceled'];

function isFailedJob(data: unknown): boolean {
  if (!isRecord(data)) return false;
  const status = data['status'];
  return (
    typeof status === 'string' &&
    FAILED_JOB_STATUSES.includes(status.trim().toLowerCase())
  );
}

/**
 * Cố gắng đọc job_id từ response Colab.
 * Colab notebook hiện trả `{"job_id": "...", "status": "queued", ...}`.
 */
function extractJobId(data: unknown): string | undefined {
  if (!isRecord(data)) return undefined;
  const direct = data['job_id'];
  if (typeof direct === 'string' && direct.length > 0) return direct;
  // fallback một vài shape phổ biến
  const nested = isRecord(data['result']) ? data['result']['job_id'] : null;
  if (typeof nested === 'string' && nested.length > 0) return nested;
  const idAlt = data['id'];
  if (typeof idAlt === 'string' && idAlt.length > 0) return idAlt;
  return undefined;
}

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);
  private readonly requestTimeoutMs: number;
  private readonly defaultHeaders = {
    // Bypass cảnh báo trình duyệt của ngrok free
    'ngrok-skip-browser-warning': 'true',
  } as const;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @Inject(HIGHLIGHT_COLAB_POOL)
    private readonly highlightPool: ColabPoolService,
    @Inject(MASCOT_COLAB_POOL) private readonly mascotPool: ColabPoolService,
    private readonly jobs: JobRegistryService,
    private readonly quota: QuotaService,
    private readonly mediaClient: MediaClientService,
  ) {
    this.requestTimeoutMs =
      this.configService.get<ColabConfig>('colab')?.requestTimeoutMs ?? 600000;
  }

  // -----------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------
  private rethrowAxios(error: unknown): never {
    const axiosError = error as AxiosError<unknown> | undefined;
    const payload = axiosError?.response?.data ?? 'Colab Error';
    const status = axiosError?.response?.status ?? 500;
    throw new HttpException(payload as string | Record<string, any>, status);
  }

  private async forwardForm<T = unknown>(
    colabUrl: string,
    path: string,
    formData: FormData,
  ): Promise<T> {
    const resp = await firstValueFrom(
      this.httpService.post<T>(`${colabUrl}${path}`, formData, {
        headers: { ...this.defaultHeaders, ...formData.getHeaders() },
        timeout: this.requestTimeoutMs,
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      }),
    );
    return resp.data;
  }

  private async forwardJson<T = unknown>(
    colabUrl: string,
    path: string,
    body: Record<string, unknown>,
  ): Promise<T> {
    const resp = await firstValueFrom(
      this.httpService.post<T>(`${colabUrl}${path}`, body, {
        headers: {
          ...this.defaultHeaders,
          'Content-Type': 'application/json',
        },
        timeout: this.requestTimeoutMs,
      }),
    );
    return resp.data;
  }

  private async pickAndPersist(
    pool: ColabPoolService,
    quotaCtx: QuotaContext,
    callable: (colabUrl: string) => Promise<unknown>,
  ): Promise<unknown> {
    const cost = await this.quota.reserve(quotaCtx);

    let colabUrl: string;
    try {
      colabUrl = await pool.pickHealthy();
    } catch (error) {
      // Không có worker nào healthy → job chưa hề được submit, hoàn credit.
      await this.quota.refund(quotaCtx.userId, cost);
      throw error;
    }

    try {
      const data = await callable(colabUrl);
      const jobId = extractJobId(data);
      if (jobId) {
        await this.jobs.bind(jobId, colabUrl);
        // Colab đã nhận job → reserve không rollback được nữa, phải ghi lại
        // credit để hoàn nếu job chết dọc đường.
        await this.quota.rememberJob(jobId, quotaCtx.userId, cost);
        this.logger.log(`Bound job ${jobId} → ${colabUrl}`);
      } else {
        this.logger.debug(
          `Forwarded request to ${colabUrl} (no job_id in response, skipping bind)`,
        );
      }
      return data;
    } catch (error) {
      // Submit thất bại đồng bộ (ngrok chết, HTTP lỗi) → hoàn credit.
      await this.quota.refund(quotaCtx.userId, cost);
      this.rethrowAxios(error);
    }
  }

  async getQuota(userId?: number, role?: number): Promise<QuotaSnapshot> {
    return this.quota.peek(userId, role);
  }

  // -----------------------------------------------------------------
  // 1. Highlight Reel — multipart upload
  // -----------------------------------------------------------------
  async createHighlightReel(
    video: Express.Multer.File,
    body: unknown,
    userIdFromHeader?: number,
    role?: number,
    durationSec?: number,
  ): Promise<unknown> {
    const quota: QuotaContext = {
      userId: userIdFromHeader,
      role,
      feature: 'highlight',
      durationSec,
    };
    return this.pickAndPersist(this.highlightPool, quota, async (colabUrl) => {
      const formData = new FormData();
      formData.append('video', video.buffer, {
        filename: video.originalname,
        contentType: video.mimetype,
      });
      const topic = getStringField(body, 'topic');
      const includeKeywords = getStringField(body, 'include_keywords');
      const excludeKeywords = getStringField(body, 'exclude_keywords');
      const isOpenAI = getStringField(body, 'isOpenAI');
      const isMultiOutput = getStringField(body, 'isMultiOutput');
      formData.append('user_id', String(userIdFromHeader ?? ''));
      if (topic) formData.append('topic', topic);
      if (includeKeywords) formData.append('include_keywords', includeKeywords);
      if (excludeKeywords) formData.append('exclude_keywords', excludeKeywords);
      if (isOpenAI) formData.append('isOpenAI', isOpenAI);
      if (isMultiOutput) formData.append('isMultiOutput', isMultiOutput);

      return this.forwardForm(colabUrl, '/highlight-reel', formData);
    });
  }

  // -----------------------------------------------------------------
  // 2. Highlight Reel — JSON link (video_url)
  // -----------------------------------------------------------------
  async createHighlightReelLink(
    body: unknown,
    userIdFromHeader?: number,
    role?: number,
    durationSec?: number,
  ): Promise<unknown> {
    const payloadBody = isRecord(body) ? body : {};
    const usesSegmentSelection =
      Array.isArray(payloadBody['keep_ranges']) ||
      Array.isArray(payloadBody['remove_ranges']);

    if (usesSegmentSelection && typeof payloadBody['video_id'] !== 'number') {
      throw new HttpException(
        'video_id is required when keep_ranges or remove_ranges are provided',
        400,
      );
    }

    let resolvedSrtUrl: string | undefined;
    if (usesSegmentSelection) {
      const video = await this.mediaClient.getVideoById(
        payloadBody['video_id'] as number,
      );
      if (!video?.srt_raw_url) {
        throw new HttpException(
          'video has no saved subtitle file (srt_raw_url)',
          400,
        );
      }
      resolvedSrtUrl = video.srt_raw_url;
    }

    const quota: QuotaContext = {
      userId: userIdFromHeader,
      role,
      feature: 'highlight',
      durationSec,
    };
    return this.pickAndPersist(this.highlightPool, quota, async (colabUrl) => {
      const payload: Record<string, unknown> = {
        user_id: userIdFromHeader ?? null,
      };
      if (isRecord(body)) {
        for (const [k, v] of Object.entries(body)) {
          payload[k] = v;
        }
      }
      if (resolvedSrtUrl) payload.srt_url = resolvedSrtUrl;
      return this.forwardJson(colabUrl, '/highlight-reel-link', payload);
    });
  }

  // -----------------------------------------------------------------
  // 2a. Highlight Segment Removal (spec 003-highlight-segment-removal) —
  // bỏ đoạn khỏi một highlight single-output đã tạo xong. Luôn cắt lại từ
  // video GỐC (original_video_id), không phải từ chính file highlight —
  // xem plan.md/research.md của spec để biết lý do.
  //
  // Body từ FE: { video_id: number, remove_ranges: {start_index,end_index}[] }
  // -----------------------------------------------------------------
  async editHighlightSegments(
    body: unknown,
    userIdFromHeader?: number,
    role?: number,
  ): Promise<unknown> {
    const payloadBody = isRecord(body) ? body : {};
    const videoId = payloadBody['video_id'];
    const removeRanges = payloadBody['remove_ranges'];

    if (typeof videoId !== 'number') {
      throw new HttpException('video_id is required', 400);
    }
    if (!Array.isArray(removeRanges) || removeRanges.length === 0) {
      throw new HttpException(
        'remove_ranges must be a non-empty array',
        400,
      );
    }

    const video = await this.mediaClient.getVideoById(videoId);
    if (!video) {
      throw new NotFoundException('video not found');
    }
    // FR-011: chỉ chủ sở hữu highlight mới được sửa.
    if (video.user_id !== userIdFromHeader) {
      throw new HttpException('forbidden', 403);
    }
    if (video.type !== 'highlight') {
      throw new HttpException(
        'segment removal is only available for highlight videos',
        400,
      );
    }
    // FR-008 (gián tiếp): multi-output/không rõ video gốc thì không bao giờ
    // có original_video_id — cùng 1 check này chặn cả 2 lý do (FR-008 lẫn
    // FR-012), không cần cột/flag riêng để phân biệt (xem data-model.md).
    if (!video.original_video_id) {
      throw new HttpException(
        'this highlight is not eligible for segment removal (no linked source video)',
        400,
      );
    }
    if (!video.srt_raw_url) {
      throw new HttpException(
        'this highlight has no segment data to edit',
        400,
      );
    }
    if (!video.job_id) {
      // Không nên xảy ra với 1 row type=highlight hợp lệ — nhưng target_job_id
      // là bắt buộc cho Colab (xem HighlightEditBody.target_job_id), nên chặn
      // sớm ở đây thay vì để Colab tự raise lỗi khó hiểu hơn.
      throw new HttpException(
        'this highlight is missing its original job id — cannot edit',
        500,
      );
    }
    // FR-009: chỉ 1 edit tại một thời điểm cho mỗi highlight.
    if (video.editing_job_id) {
      throw new HttpException(
        'an edit is already in progress for this video',
        409,
      );
    }

    const sourceVideo = await this.mediaClient.getVideoById(
      video.original_video_id,
    );
    if (!sourceVideo?.url) {
      throw new HttpException(
        'the source video this highlight was generated from is no longer available',
        409,
      );
    }

    const quota: QuotaContext = {
      userId: userIdFromHeader,
      role,
      feature: 'highlight',
    };
    const result = await this.pickAndPersist(
      this.highlightPool,
      quota,
      async (colabUrl) => {
        const payload: Record<string, unknown> = {
          // Colab's HighlightEditBody.user_id is `str` (Pydantic) — unlike
          // createHighlightReelLink's payload, nothing here later overwrites
          // this with a frontend-supplied string, so it must be stringified now.
          user_id: String(userIdFromHeader ?? ''),
          video_id: videoId,
          video_url: sourceVideo.url,
          current_srt_url: video.srt_raw_url,
          target_job_id: video.job_id,
          remove_ranges: removeRanges,
        };
        return this.forwardJson(colabUrl, '/highlight-edit-link', payload);
      },
    );

    const jobId = extractJobId(result);
    if (jobId) {
      // Đặt guard NGAY sau khi Colab đã nhận job — tránh race giữa 2 request
      // gần như đồng thời (double-click) đều pass qua check editing_job_id
      // ở trên trước khi cái nào set guard trước.
      await this.mediaClient.updateVideo(videoId, { editing_job_id: jobId });
    }

    return result;
  }

  // -----------------------------------------------------------------
  // 2b. Transcribe — Whisper SRT từ video URL
  //
  // Body từ FE:
  //   {
  //     video_url: string                  (bắt buộc)
  //     source_original_filename: string
  //     language?: 'vi'|'en'|...
  //     video_id?: number                  ← MỚI: ID của row `videos` đã có
  //                                          → khi xong, webhook tự update
  //                                            videos.srt_raw_url WHERE id=<video_id>
  //                                          không cần FE call thêm endpoint
  //   }
  // -----------------------------------------------------------------
  async createTranscribe(
    body: unknown,
    userIdFromHeader?: number,
    role?: number,
    durationSec?: number,
  ): Promise<unknown> {
    const quota: QuotaContext = {
      userId: userIdFromHeader,
      role,
      feature: 'transcribe',
      durationSec,
    };
    return this.pickAndPersist(this.highlightPool, quota, async (colabUrl) => {
      const formData = new FormData();
      formData.append('user_id', String(userIdFromHeader ?? ''));

      // Forward các field client gửi (video_url, source_original_filename, language, video_id)
      if (isRecord(body)) {
        for (const [k, v] of Object.entries(body)) {
          if (typeof v === 'string') formData.append(k, v);
          else if (typeof v === 'number' || typeof v === 'boolean')
            formData.append(k, String(v));
        }
      }

      return this.forwardForm(colabUrl, '/transcribe', formData);
    });
  }

  // -----------------------------------------------------------------
  // 3. Mascot Video (legacy endpoint — vẫn route qua pool)
  // -----------------------------------------------------------------
  async createMascot(
    mascotImageUrl: string,
    originFileName: string,
    audio: Express.Multer.File | undefined,
    body: unknown,
    userIdFromHeader?: number,
    role?: number,
    durationSec?: number,
  ): Promise<unknown> {
    const quota: QuotaContext = {
      userId: userIdFromHeader,
      role,
      feature: 'mascot',
      durationSec,
    };
    return this.pickAndPersist(this.mascotPool, quota, async (colabUrl) => {
      const formData = new FormData();

      appendMascotField(formData, body, 'video_url');
      formData.append('user_id', String(userIdFromHeader ?? ''));
      formData.append('mascot_image_url', mascotImageUrl);
      formData.append('origin_file_name', originFileName);

      appendMascotField(formData, body, 'position', 'bottom-right');
      appendMascotField(formData, body, 'margin_x', '40');
      appendMascotField(formData, body, 'margin_y', '40');
      appendMascotField(formData, body, 'scale', '0.25');
      appendMascotField(formData, body, 'text_overlays', '');

      appendMascotField(formData, body, 'brightness');
      appendMascotField(formData, body, 'contrast');
      appendMascotField(formData, body, 'saturation');
      appendMascotField(formData, body, 'gamma');

      appendMascotField(formData, body, 'remove_background', 'false');
      appendMascotField(formData, body, 'bg_mode', 'green_screen');
      appendMascotField(formData, body, 'bg_quality_mode', 'fast');
      appendMascotField(formData, body, 'green_screen_color', '00FF00');
      appendMascotField(formData, body, 'chromakey_similarity');
      appendMascotField(formData, body, 'chromakey_blend');
      appendMascotField(formData, body, 'alpha_contract_px');
      appendMascotField(formData, body, 'alpha_blur_px');

      appendMascotField(formData, body, 'animation_mode', 'human');
      appendMascotField(formData, body, 'quality_mode', 'ultrafast');
      appendMascotField(formData, body, 'cfg_scale');
      appendMascotField(formData, body, 'driving_multiplier');
      appendMascotField(formData, body, 'flag_stitching');
      appendMascotField(formData, body, 'flag_pasteback');
      appendMascotField(formData, body, 'flag_normalize_lip');
      appendMascotField(formData, body, 'flag_relative_motion');
      appendMascotField(formData, body, 'flag_do_crop');
      appendMascotField(formData, body, 'crop_scale');
      appendMascotField(formData, body, 'vx_ratio');
      appendMascotField(formData, body, 'vy_ratio');

      if (audio) {
        formData.append('audio', audio.buffer, {
          filename: audio.originalname,
          contentType: audio.mimetype,
        });
      }

      console.log('check form data', formData);

      return this.forwardForm(colabUrl, '/mascot', formData);
    });
  }

  // -----------------------------------------------------------------
  // 4. Generate Quiz
  // -----------------------------------------------------------------
  async generateQuiz(
    body: unknown,
    userIdFromHeader?: number,
    role?: number,
    durationSec?: number,
  ): Promise<unknown> {
    const quota: QuotaContext = {
      userId: userIdFromHeader,
      role,
      feature: 'quiz',
      durationSec,
    };
    return this.pickAndPersist(this.highlightPool, quota, async (colabUrl) => {
      const formData = new FormData();
      if (isRecord(body)) {
        for (const key of Object.keys(body)) {
          const value = body[key];
          if (typeof value === 'string') formData.append(key, value);
        }
      }
      return this.forwardForm(colabUrl, '/generate-quiz', formData);
    });
  }

  // -----------------------------------------------------------------
  // 5. Job status — phải route đến đúng Colab đã nhận POST gốc
  // -----------------------------------------------------------------
  async getJobStatus(jobId: string): Promise<unknown> {
    const colabUrl = await this.resolveJobColab(jobId);
    try {
      const resp = await firstValueFrom(
        this.httpService.get<unknown>(`${colabUrl}/jobs/status/${jobId}`, {
          headers: this.defaultHeaders,
          timeout: this.requestTimeoutMs,
        }),
      );
      // FE poll status xuyên qua đây, nên đây là chỗ duy nhất server tự biết
      // job đã chết mà không phải tin client.
      if (isFailedJob(resp.data)) {
        await this.quota.refundJob(jobId);
      }
      return resp.data;
    } catch (error) {
      this.rethrowAxios(error);
    }
  }

  // -----------------------------------------------------------------
  // 6. Download — stream từ đúng Colab worker
  // -----------------------------------------------------------------
  async downloadVideo(jobId: string, res: Response): Promise<void> {
    const colabUrl = await this.resolveJobColab(jobId);
    try {
      const response = await this.httpService.axiosRef.get<Readable>(
        `${colabUrl}/download/${jobId}`,
        {
          responseType: 'stream',
          headers: this.defaultHeaders,
          timeout: this.requestTimeoutMs,
        },
      );

      const headers = response.headers as Record<string, string | undefined>;
      const contentType = headers['content-type'];
      if (contentType) res.setHeader('Content-Type', contentType);
      const disposition = headers['content-disposition'];
      if (disposition) res.setHeader('Content-Disposition', disposition);
      const contentLength = headers['content-length'];
      if (contentLength) res.setHeader('Content-Length', contentLength);

      response.data.pipe(res);
    } catch (error) {
      const axiosError = error as AxiosError<unknown> | undefined;
      const status = axiosError?.response?.status ?? 404;
      throw new HttpException(
        'Video not found or job not completed',
        status === 404 ? 404 : status,
      );
    }
  }

  // -----------------------------------------------------------------
  // 7. Ops: trạng thái pool (cho /pool/status)
  // -----------------------------------------------------------------
  async getPoolStatus(force = false) {
    const [highlight, mascot] = await Promise.all([
      this.highlightPool.getStatus(force),
      this.mascotPool.getStatus(force),
    ]);
    return { highlight, mascot };
  }

  // -----------------------------------------------------------------
  private async resolveJobColab(jobId: string): Promise<string> {
    const colabUrl = await this.jobs.resolve(jobId);
    if (colabUrl) return colabUrl;

    // Không có mapping: job submit thẳng Colab (không qua service này), hoặc
    // TTL đã hết. Thử worker healthy trong pool thay vì bỏ cuộc — pool 1 worker
    // thì luôn đúng, pool nhiều worker thì đây là phỏng đoán tốt nhất có thể.
    this.logger.warn(
      `Job ${jobId} không có mapping — fallback sang worker healthy trong pool.`,
    );
    try {
      return await this.highlightPool.pickHealthy();
    } catch {
      throw new NotFoundException(
        `Job ${jobId} mapping not found và không có Colab worker nào healthy để tra cứu.`,
      );
    }
  }

  /** Trừ credit cho job mà service khác tự submit sang Colab. Trả về cost đã trừ. */
  async reserveQuota(ctx: QuotaContext): Promise<{ cost: number }> {
    return { cost: await this.quota.reserve(ctx) };
  }

  /** Hoàn credit khi service gọi submit thất bại. */
  async refundQuota(userId: number | undefined, cost: number): Promise<void> {
    await this.quota.refund(userId, cost);
  }

  /**
   * Ghi nhớ credit của job do service khác submit, để `getJobStatus` hoàn lại
   * khi job chết trên Colab. Không có bước này thì job fail = mất credit.
   */
  async rememberQuotaJob(
    jobId: string,
    userId: number | undefined,
    cost: number,
  ): Promise<void> {
    await this.quota.rememberJob(jobId, userId, cost);
  }
}
