import {
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
import { ColabConfig } from './config/colab.config';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getStringField(obj: unknown, key: string): string | undefined {
  if (!isRecord(obj)) return undefined;
  const v = obj[key];
  return typeof v === 'string' ? v : undefined;
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
    private readonly pool: ColabPoolService,
    private readonly jobs: JobRegistryService,
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
    callable: (colabUrl: string) => Promise<unknown>,
  ): Promise<unknown> {
    const colabUrl = await this.pool.pickHealthy();
    try {
      const data = await callable(colabUrl);
      const jobId = extractJobId(data);
      if (jobId) {
        await this.jobs.bind(jobId, colabUrl);
        this.logger.log(`Bound job ${jobId} → ${colabUrl}`);
      } else {
        this.logger.debug(
          `Forwarded request to ${colabUrl} (no job_id in response, skipping bind)`,
        );
      }
      return data;
    } catch (error) {
      this.rethrowAxios(error);
    }
  }

  // -----------------------------------------------------------------
  // 1. Highlight Reel — multipart upload
  // -----------------------------------------------------------------
  async createHighlightReel(
    video: Express.Multer.File,
    body: unknown,
    userIdFromHeader?: number,
  ): Promise<unknown> {
    return this.pickAndPersist(async (colabUrl) => {
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
  ): Promise<unknown> {
    return this.pickAndPersist(async (colabUrl) => {
      const payload: Record<string, unknown> = {
        user_id: userIdFromHeader ?? null,
      };
      if (isRecord(body)) {
        for (const [k, v] of Object.entries(body)) {
          payload[k] = v;
        }
      }
      return this.forwardJson(colabUrl, '/highlight-reel-link', payload);
    });
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
  ): Promise<unknown> {
    return this.pickAndPersist(async (colabUrl) => {
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
  ): Promise<unknown> {
    return this.pickAndPersist(async (colabUrl) => {
      const formData = new FormData();
      const videoUrl = getStringField(body, 'video_url');
      const position = getStringField(body, 'position');
      const marginX = getStringField(body, 'margin_x') ?? '40';
      const marginY = getStringField(body, 'margin_y') ?? '40';
      const scale = getStringField(body, 'scale') ?? '1.0';

      if (videoUrl) formData.append('video_url', videoUrl);
      if (position) formData.append('position', position);
      formData.append('user_id', String(userIdFromHeader ?? ''));
      formData.append('margin_x', marginX);
      formData.append('margin_y', marginY);
      formData.append('scale', scale);
      formData.append('mascot_image_url', mascotImageUrl);
      formData.append('origin_file_name', originFileName);

      if (audio) {
        formData.append('audio', audio.buffer, {
          filename: audio.originalname,
          contentType: audio.mimetype,
        });
      }

      return this.forwardForm(colabUrl, '/mascot', formData);
    });
  }

  // -----------------------------------------------------------------
  // 4. Generate Quiz
  // -----------------------------------------------------------------
  async generateQuiz(body: unknown): Promise<unknown> {
    return this.pickAndPersist(async (colabUrl) => {
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
    return this.pool.getStatus(force);
  }

  // -----------------------------------------------------------------
  private async resolveJobColab(jobId: string): Promise<string> {
    const colabUrl = await this.jobs.resolve(jobId);
    if (!colabUrl) {
      this.logger.warn(
        `Job ${jobId} not found in Redis registry — mapping mất hoặc TTL expire.`,
      );
      throw new NotFoundException(
        `Job ${jobId} mapping not found. Có thể TTL đã hết, hoặc job được tạo từ trước khi bật scale-out.`,
      );
    }
    return colabUrl;
  }
}
