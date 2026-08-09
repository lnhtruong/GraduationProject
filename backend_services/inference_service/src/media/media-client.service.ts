import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import type { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';

export interface VideoLookup {
  id: number;
  user_id: number;
  type: string;
  url: string | null;
  srt_raw_url: string | null;
  original_video_id: number | null;
  editing_job_id: string | null;
  /**
   * The Colab job that originally produced this row. An edit's Cloudinary
   * re-upload must reuse this same job_id (not the edit job's own id) so
   * Cloudinary's own upload-complete webhook (handleCloudinaryVideo/
   * handleCloudinaryRawSrt in media_service, independent of the QStash
   * completion event this feature relies on) updates THIS row in place
   * instead of creating an orphan row keyed by a job_id it's never seen.
   */
  job_id: string | null;
}

export interface UpdateVideoPayload {
  editing_job_id?: string | null;
}

@Injectable()
export class MediaClientService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async getVideoById(videoId: number): Promise<VideoLookup | null> {
    const baseUrl = this.configService.get<string>('MEDIA_SERVICE_URL');
    try {
      const resp = await firstValueFrom(
        this.httpService.get<VideoLookup>(`${baseUrl}/videos/${videoId}`),
      );
      return resp.data;
    } catch (error) {
      if ((error as AxiosError)?.response?.status === 404) return null;
      throw error;
    }
  }

  async updateVideo(
    videoId: number,
    dto: UpdateVideoPayload,
  ): Promise<VideoLookup> {
    const baseUrl = this.configService.get<string>('MEDIA_SERVICE_URL');
    const resp = await firstValueFrom(
      this.httpService.patch<VideoLookup>(`${baseUrl}/videos/${videoId}`, dto),
    );
    return resp.data;
  }
}
