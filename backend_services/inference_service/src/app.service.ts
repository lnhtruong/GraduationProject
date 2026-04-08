import { Injectable, HttpException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import FormData from 'form-data';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import { InjectModel } from '@nestjs/sequelize';
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
      formData.append('user_id', String(userIdFromHeader ?? ''));
      if (topic) formData.append('topic', topic);
      if (includeKeywords) formData.append('include_keywords', includeKeywords);
      if (excludeKeywords) formData.append('exclude_keywords', excludeKeywords);
      if (isOpenAI) formData.append('isOpenAI', isOpenAI);

      const response = await firstValueFrom(
        this.httpService.post<unknown>(
          `${this.colabUrl}/highlight-reel`,
          formData,
          {
            headers: formData.getHeaders(),
          },
        ),
      );

      // console.log('check res: ', response);

      // const data = response.data as any;
      // const outputUrl: string | undefined = isRecord(data)
      //   ? (data.download_url as string | undefined) ?? (data.url as string | undefined)
      //   : undefined;

      // const userId = userIdFromHeader;

      // if (outputUrl && userId && !Number.isNaN(userId)) {
      //   await this.videoModel.create({
      //     user_id: userId,
      //     type: VideoType.HIGHLIGHT,
      //     url: outputUrl,
      //   });
      // }

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
        this.httpService.post<unknown>(`${this.colabUrl}/mascot`, formData, {
          headers: formData.getHeaders(),
        }),
      );

      // console.log('check response: ', response);

      // const data = response.data as any;
      // const outputUrl: string | undefined = isRecord(data)
      //   ? (data.download_url as string | undefined) ??
      //   (data.url as string | undefined)
      //   : undefined;

      // const userId = userIdFromHeader;

      // if (outputUrl && userId && !Number.isNaN(userId)) {
      //   await this.videoModel.create({
      //     user_id: userId,
      //     type: VideoType.MASCOT,
      //     url: outputUrl,
      //   });
      // }

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
