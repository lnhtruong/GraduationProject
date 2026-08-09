import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import type { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';

export interface VideoLookup {
  id: number;
  srt_raw_url: string | null;
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
}
