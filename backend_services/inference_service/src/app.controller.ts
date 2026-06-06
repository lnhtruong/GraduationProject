import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  Res,
  BadRequestException,
  Headers,
} from '@nestjs/common';
import {
  FileInterceptor,
  NoFilesInterceptor,
} from '@nestjs/platform-express';
import { AppService } from './app.service';
import type { Response } from 'express';

function parseUserId(userIdHeader?: string): number | undefined {
  return typeof userIdHeader === 'string' && userIdHeader.trim().length > 0
    ? Number(userIdHeader)
    : undefined;
}

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHome() {
    return {
      service: 'Inference Service (Colab Pool)',
      message:
        'Forwards inference workload to a pool of Colab notebooks behind ngrok.',
      endpoints: {
        transcribe: 'POST /transcribe (JSON)',
        highlight_upload: 'POST /highlight-reel (FormData)',
        highlight_link: 'POST /highlight-reel-link (JSON)',
        generate_quiz: 'POST /generate-quiz',
        mascot: 'POST /mascot (legacy)',
        job_status: 'GET /jobs/status/:job_id',
        download: 'GET /download/:job_id',
        pool_status: 'GET /pool/status',
      },
    };
  }

  // POST /transcribe — JSON với { video_url, source_original_filename, language? }
  @Post('transcribe')
  async createTranscribe(
    @Body() body: unknown,
    @Headers('x-user-id') userIdHeader?: string,
  ): Promise<unknown> {
    return this.appService.createTranscribe(body, parseUserId(userIdHeader));
  }

  // GET /pool/status — Ops/debug
  @Get('pool/status')
  async getPoolStatus(@Query('force') force?: string) {
    return this.appService.getPoolStatus(force === '1' || force === 'true');
  }

  // POST /highlight-reel — multipart upload
  @Post('highlight-reel')
  @UseInterceptors(FileInterceptor('video'))
  async createHighlightReel(
    @UploadedFile() video: Express.Multer.File,
    @Body() body: unknown,
    @Headers('x-user-id') userIdHeader?: string,
  ): Promise<unknown> {
    if (!video) throw new BadRequestException('Video file is required');
    return this.appService.createHighlightReel(
      video,
      body,
      parseUserId(userIdHeader),
    );
  }

  // POST /highlight-reel-link — JSON với video_url
  @Post('highlight-reel-link')
  async createHighlightReelLink(
    @Body() body: unknown,
    @Headers('x-user-id') userIdHeader?: string,
  ): Promise<unknown> {
    const videoUrl =
      typeof body === 'object' &&
      body !== null &&
      'video_url' in body &&
      typeof (body as Record<string, unknown>).video_url === 'string'
        ? (body as Record<string, string>).video_url
        : undefined;

    if (!videoUrl || videoUrl.trim().length === 0) {
      throw new BadRequestException('video_url is required');
    }

    return this.appService.createHighlightReelLink(
      body,
      parseUserId(userIdHeader),
    );
  }

  // POST /mascot
  @Post('mascot')
  @UseInterceptors(FileInterceptor('audio'))
  async createMascotJob(
    @UploadedFile() audio: Express.Multer.File,
    @Body() body: unknown,
    @Headers('x-user-id') userIdHeader?: string,
  ): Promise<unknown> {
    const mascotImageUrl =
      typeof body === 'object' &&
      body !== null &&
      'mascot_image_url' in body &&
      typeof (body as Record<string, unknown>).mascot_image_url === 'string'
        ? (body as Record<string, string>).mascot_image_url
        : undefined;

    if (!mascotImageUrl || mascotImageUrl.trim().length === 0) {
      throw new BadRequestException('mascot_image_url is required');
    }

    const originFileName =
      typeof body === 'object' &&
      body !== null &&
      'origin_file_name' in body &&
      typeof (body as Record<string, unknown>).origin_file_name === 'string'
        ? (body as Record<string, string>).origin_file_name
        : undefined;

    if (!originFileName || originFileName.trim().length === 0) {
      throw new BadRequestException('origin_file_name is required');
    }

    return this.appService.createMascot(
      mascotImageUrl,
      originFileName,
      audio,
      body,
      parseUserId(userIdHeader),
    );
  }

  // POST /generate-quiz
  @Post('generate-quiz')
  @UseInterceptors(NoFilesInterceptor())
  async generateQuiz(@Body() body: unknown): Promise<unknown> {
    return this.appService.generateQuiz(body);
  }

  // GET /jobs/status/:job_id
  @Get('jobs/status/:job_id')
  async getJobStatus(@Param('job_id') jobId: string): Promise<unknown> {
    return this.appService.getJobStatus(jobId);
  }

  // GET /download/:job_id
  @Get('download/:job_id')
  async downloadVideo(@Param('job_id') jobId: string, @Res() res: Response) {
    return this.appService.downloadVideo(jobId, res);
  }
}
