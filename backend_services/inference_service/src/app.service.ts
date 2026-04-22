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
  return typeof v === 'string' ? v : undefined;
}

function getBoolField(obj: unknown, key: string): boolean | undefined {
  if (!isRecord(obj)) return undefined;
  const v = obj[key];
  if (typeof v === 'boolean') return v;
  if (v === 'true') return true;
  if (v === 'false') return false;
  return undefined;
}

function getIntField(obj: unknown, key: string): number | undefined {
  if (!isRecord(obj)) return undefined;
  const v = obj[key];
  if (typeof v === 'number' && Number.isFinite(v)) return Math.trunc(v);
  if (typeof v === 'string') {
    const n = parseInt(v, 10);
    return isNaN(n) ? undefined : n;
  }
  return undefined;
}

@Injectable()
export class AppService {
  private colabUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.colabUrl = this.configService.getOrThrow<string>('COLAB_API_URL');
  }

  // 1. Tạo Highlight Reel
  async createHighlightReel(
    body: unknown,
    userIdFromHeader?: number,
  ): Promise<unknown> {
    try {
      const videoUrl = getStringField(body, 'video_url');
      if (!videoUrl || videoUrl.trim().length === 0) {
        throw new HttpException('video_url is required', 400);
      }

      const topic = getStringField(body, 'topic');
      if (!topic || topic.trim().length === 0) {
        throw new HttpException('topic is required', 400);
      }

      const includeKeywords = getStringField(body, 'include_keywords');
      if (!includeKeywords || includeKeywords.trim().length === 0) {
        throw new HttpException('include_keywords is required', 400);
      }

      const excludeKeywords = getStringField(body, 'exclude_keywords') ?? '';
      const isOpenAI = getBoolField(body, 'isOpenAI') ?? false;
      const targetMin = getIntField(body, 'target_min') ?? 120;
      const targetMax = getIntField(body, 'target_max') ?? 200;

      const payload: Record<string, unknown> = {
        user_id: String(userIdFromHeader ?? ''),
        video_url: videoUrl,
        topic,
        include_keywords: includeKeywords,
        exclude_keywords: excludeKeywords,
        isOpenAI,
        target_min: targetMin,
        target_max: targetMax,
      };

      const response = await firstValueFrom(
        this.httpService.post<unknown>(
          `${this.colabUrl}/highlight-reel`,
          payload,
          { headers: { 'Content-Type': 'application/json' } },
        ),
      );

      return response.data;
    } catch (error: unknown) {
      if (error instanceof HttpException) throw error;
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
        this.httpService.post<unknown>(`${this.colabUrl}/mascot`, formData, {
          headers: formData.getHeaders(),
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
          `${this.colabUrl}/generate-quiz`,
          formData,
          {
            headers: formData.getHeaders(),
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

  // 4. Lấy trạng thái Job
  async getJobStatus(
    jobId: string,
    userIdFromHeader?: number,
  ): Promise<unknown> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<unknown>(`${this.colabUrl}/jobs/status/${jobId}`),
      );

      const data = response.data as any;
      console.log('check data: ', data);
      const outputUrl = (data as any)?.result?.download_url as string | '';

      const userId = userIdFromHeader;
      const isHighlight = (data as any)?.type?.includes('highlight-reel');

      return response.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosError<unknown> | undefined;
      const payload = axiosError?.response?.data ?? 'Colab Error';
      const status = axiosError?.response?.status ?? 500;
      throw new HttpException(payload as string | Record<string, any>, status);
    }
  }

  // 5. Download Video (Stream)
  async downloadVideo(jobId: string, res: Response) {
    try {
      const response = await this.httpService.axiosRef.get<Readable>(
        `${this.colabUrl}/download/${jobId}`,
        { responseType: 'stream' },
      );

      // Set header từ Colab sang NestJS
      const headers = response.headers as Record<string, string | undefined>;
      const contentType = headers['content-type'];
      if (contentType) res.setHeader('Content-Type', contentType);
      const disposition = headers['content-disposition'];
      if (disposition) {
        res.setHeader('Content-Disposition', disposition);
      }

      // Pipe stream thẳng về FE
      response.data.pipe(res);
    } catch {
      throw new HttpException('Video not found or job not completed', 404);
    }
  }
}
