import { Injectable, HttpException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import FormData from 'form-data';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
// import { InjectModel } from '@nestjs/sequelize';
import type { Response } from 'express';
import type { Readable } from 'stream';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getStringField(obj: unknown, key: string): string | undefined {
  if (!isRecord(obj)) return undefined;
  const v = obj[key];
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  return undefined;
}

@Injectable()
export class AppService {
  private highlightUrl: string;
  private mascotUrl: string;
  private ngrokHeaders = { 'ngrok-skip-browser-warning': 'true' };

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.highlightUrl = this.configService.getOrThrow<string>('COLAB_HIGHLIGHT_URL');
    this.mascotUrl = this.configService.getOrThrow<string>('COLAB_MASCOT_URL');
  }

  // 1. Tạo Highlight Reel (file upload)
  async createHighlightReel(
    video: Express.Multer.File,
    body: unknown,
    userIdFromHeader?: number,
  ): Promise<unknown> {
    try {
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
      const targetMin = getStringField(body, 'target_min');
      const targetMax = getStringField(body, 'target_max');
      formData.append('user_id', String(userIdFromHeader ?? ''));
      if (topic) formData.append('topic', topic);
      if (includeKeywords) formData.append('include_keywords', includeKeywords);
      if (excludeKeywords) formData.append('exclude_keywords', excludeKeywords);
      if (isOpenAI) formData.append('isOpenAI', isOpenAI);
      if (isMultiOutput) formData.append('isMultiOutput', isMultiOutput);
      if (targetMin) formData.append('target_min', targetMin);
      if (targetMax) formData.append('target_max', targetMax);

      const response = await firstValueFrom(
        this.httpService.post<unknown>(
          `${this.highlightUrl}/highlight-reel`,
          formData,
          {
            headers: { ...formData.getHeaders(), ...this.ngrokHeaders },
          },
        ),
      );

      return response.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosError<unknown> | undefined;
      const payload = axiosError?.response?.data ?? 'Colab Error';
      const status = axiosError?.response?.status ?? 500;
      throw new HttpException(payload as string | Record<string, any>, status);
    }
  }

  // 1b. Tạo Highlight Reel (video link — download locally on Colab for speed)
  async createHighlightReelLink(
    body: unknown,
    userIdFromHeader?: number,
  ): Promise<unknown> {
    try {
      const videoUrl = getStringField(body, 'video_url');
      const topic = getStringField(body, 'topic');
      const includeKeywords = getStringField(body, 'include_keywords');
      const excludeKeywords = getStringField(body, 'exclude_keywords');
      const isOpenAI = getStringField(body, 'isOpenAI');
      const isMultiOutput = getStringField(body, 'isMultiOutput');
      const targetMin = getStringField(body, 'target_min');
      const targetMax = getStringField(body, 'target_max');

      if (!videoUrl) {
        throw new HttpException('video_url is required', 400);
      }

      const payload: Record<string, unknown> = {
        user_id: String(userIdFromHeader ?? ''),
        video_url: videoUrl,
        topic: topic ?? '',
        include_keywords: includeKeywords ?? '',
        exclude_keywords: excludeKeywords ?? '',
        isOpenAI: isOpenAI === 'true',
        isMultiOutput: isMultiOutput === 'true',
      };
      if (targetMin) payload.target_min = Number(targetMin);
      if (targetMax) payload.target_max = Number(targetMax);

      const response = await firstValueFrom(
        this.httpService.post<unknown>(
          `${this.highlightUrl}/highlight-reel-link`,
          payload,
          { headers: { 'Content-Type': 'application/json', ...this.ngrokHeaders } },
        ),
      );

      return response.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosError<unknown> | undefined;
      const payload = axiosError?.response?.data ?? 'Colab Error';
      const status = axiosError?.response?.status ?? 500;
      throw new HttpException(payload as string | Record<string, any>, status);
    }
  }

  // 2. Tạo Mascot Video
  async createMascot(
    mascotImageUrl: string,
    originFileName: string,
    audio: Express.Multer.File | undefined,
    body: unknown,
    userIdFromHeader?: number,
  ): Promise<unknown> {
    try {
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

      const response = await firstValueFrom(
        this.httpService.post<unknown>(`${this.mascotUrl}/mascot`, formData, {
          headers: { ...formData.getHeaders(), ...this.ngrokHeaders },
        }),
      );

      return response.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosError<unknown> | undefined;
      const payload = axiosError?.response?.data ?? 'Colab Error';
      const status = axiosError?.response?.status ?? 500;
      throw new HttpException(payload as string | Record<string, any>, status);
    }
  }

  // 3. Generate Quiz (Chỉ forward form fields, không có file)
  async generateQuiz(body: unknown): Promise<unknown> {
    try {
      const formData = new FormData();
      if (isRecord(body)) {
        Object.keys(body).forEach((key) => {
          const value = body[key];
          if (typeof value === 'string') formData.append(key, value);
        });
      }

      const response = await firstValueFrom(
        this.httpService.post<unknown>(
          `${this.highlightUrl}/generate-quiz`,
          formData,
          {
            headers: { ...formData.getHeaders(), ...this.ngrokHeaders },
          },
        ),
      );
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosError<unknown> | undefined;
      const payload = axiosError?.response?.data ?? 'Colab Error';
      const status = axiosError?.response?.status ?? 500;
      throw new HttpException(payload as string | Record<string, any>, status);
    }
  }

  // 4. Lấy trạng thái Job (try highlight first, fallback to mascot)
  async getJobStatus(
    jobId: string,
    userIdFromHeader?: number,
  ): Promise<unknown> {
    for (const baseUrl of [this.highlightUrl, this.mascotUrl]) {
      try {
        const response = await firstValueFrom(
          this.httpService.get<unknown>(`${baseUrl}/jobs/status/${jobId}`, {
            headers: this.ngrokHeaders,
          }),
        );
        return response.data;
      } catch (error: unknown) {
        const axiosError = error as AxiosError<unknown> | undefined;
        const status = axiosError?.response?.status;
        // If 404, try the other service
        if (status === 404) continue;
        // Other errors: throw immediately
        const payload = axiosError?.response?.data ?? 'Colab Error';
        throw new HttpException(payload as string | Record<string, any>, status ?? 500);
      }
    }
    throw new HttpException('Job not found', 404);
  }

  // 5. Download Video (Stream — try highlight first, fallback to mascot)
  async downloadVideo(jobId: string, res: Response) {
    for (const baseUrl of [this.highlightUrl, this.mascotUrl]) {
      try {
        const response = await this.httpService.axiosRef.get<Readable>(
          `${baseUrl}/download/${jobId}`,
          { responseType: 'stream', headers: this.ngrokHeaders },
        );

        const headers = response.headers as Record<string, string | undefined>;
        const contentType = headers['content-type'];
        if (contentType) res.setHeader('Content-Type', contentType);
        const disposition = headers['content-disposition'];
        if (disposition) {
          res.setHeader('Content-Disposition', disposition);
        }

        response.data.pipe(res);
        return;
      } catch {
        continue;
      }
    }
    throw new HttpException('Video not found or job not completed', 404);
  }
}
