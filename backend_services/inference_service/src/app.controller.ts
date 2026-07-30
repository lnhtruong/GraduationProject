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
  UnauthorizedException,
  HttpCode,
  Headers,
} from '@nestjs/common';
import { FileInterceptor, NoFilesInterceptor } from '@nestjs/platform-express';
import { AppService } from './app.service';
import type { QuotaFeature } from './quota/quota.config';
import type { Response } from 'express';

interface ReserveQuotaDto {
  userId?: number;
  role?: number;
  feature: QuotaFeature;
  durationSec?: number;
}

/** Header `x-user-id` / `x-user-role` do api_gateway đóng dấu sau khi xác thực JWT. */
function parseNumericHeader(header?: string): number | undefined {
  if (typeof header !== 'string' || header.trim().length === 0) {
    return undefined;
  }
  const parsed = Number(header);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/** Thời lượng do client khai, dùng để tính credit. Không xác minh được — xem spec mục 8. */
function parseDurationSec(body: unknown): number | undefined {
  if (typeof body !== 'object' || body === null) return undefined;
  const raw = (body as Record<string, unknown>)['duration_sec'];
  const parsed = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
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
        quota: 'GET /quota',
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
    @Headers('x-user-role') roleHeader?: string,
  ): Promise<unknown> {
    return this.appService.createTranscribe(
      body,
      parseNumericHeader(userIdHeader),
      parseNumericHeader(roleHeader),
      parseDurationSec(body),
    );
  }

  // GET /pool/status — Ops/debug
  @Get('pool/status')
  async getPoolStatus(@Query('force') force?: string) {
    return this.appService.getPoolStatus(force === '1' || force === 'true');
  }

  // GET /quota — số dư credit hôm nay + bảng giá để FE tự tính cost
  @Get('quota')
  async getQuota(
    @Headers('x-user-id') userIdHeader?: string,
    @Headers('x-user-role') roleHeader?: string,
  ) {
    return this.appService.getQuota(
      parseNumericHeader(userIdHeader),
      parseNumericHeader(roleHeader),
    );
  }

  // POST /highlight-reel — multipart upload
  @Post('highlight-reel')
  @UseInterceptors(FileInterceptor('video'))
  async createHighlightReel(
    @UploadedFile() video: Express.Multer.File,
    @Body() body: unknown,
    @Headers('x-user-id') userIdHeader?: string,
    @Headers('x-user-role') roleHeader?: string,
  ): Promise<unknown> {
    if (!video) throw new BadRequestException('Video file is required');
    return this.appService.createHighlightReel(
      video,
      body,
      parseNumericHeader(userIdHeader),
      parseNumericHeader(roleHeader),
      parseDurationSec(body),
    );
  }

  // POST /highlight-reel-link — JSON với video_url
  @Post('highlight-reel-link')
  async createHighlightReelLink(
    @Body() body: unknown,
    @Headers('x-user-id') userIdHeader?: string,
    @Headers('x-user-role') roleHeader?: string,
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
      parseNumericHeader(userIdHeader),
      parseNumericHeader(roleHeader),
      parseDurationSec(body),
    );
  }

  // POST /mascot
  @Post('mascot')
  @UseInterceptors(FileInterceptor('audio'))
  async createMascotJob(
    @UploadedFile() audio: Express.Multer.File,
    @Body() body: unknown,
    @Headers('x-user-id') userIdHeader?: string,
    @Headers('x-user-role') roleHeader?: string,
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
      parseNumericHeader(userIdHeader),
      parseNumericHeader(roleHeader),
      parseDurationSec(body),
    );
  }

  // POST /generate-quiz
  @Post('generate-quiz')
  @UseInterceptors(NoFilesInterceptor())
  async generateQuiz(
    @Body() body: unknown,
    @Headers('x-user-id') userIdHeader?: string,
    @Headers('x-user-role') roleHeader?: string,
  ): Promise<unknown> {
    return this.appService.generateQuiz(
      body,
      parseNumericHeader(userIdHeader),
      parseNumericHeader(roleHeader),
      parseDurationSec(body),
    );
  }

  // ---------------------------------------------------------------
  // Quota nội bộ — cho service tự submit job sang Colab (không qua đây)
  // nhưng vẫn muốn trừ credit. Không expose qua api_gateway.
  // ---------------------------------------------------------------
  private assertInternalSecret(secret?: string): void {
    const expected = process.env.INTERNAL_SERVICE_SECRET;
    if (expected && expected !== secret) {
      throw new UnauthorizedException('Invalid internal secret');
    }
  }

  @Post('quota/reserve')
  async reserveQuota(
    @Body() body: ReserveQuotaDto,
    @Headers('x-internal-secret') secret?: string,
  ): Promise<{ cost: number }> {
    this.assertInternalSecret(secret);
    if (!body?.feature) {
      throw new BadRequestException('feature is required');
    }
    return this.appService.reserveQuota({
      userId: body.userId,
      role: body.role,
      feature: body.feature,
      durationSec: body.durationSec,
    });
  }

  @Post('quota/job')
  @HttpCode(204)
  async rememberQuotaJob(
    @Body() body: { jobId?: string; userId?: number; cost?: number },
    @Headers('x-internal-secret') secret?: string,
  ): Promise<void> {
    this.assertInternalSecret(secret);
    if (!body?.jobId) {
      throw new BadRequestException('jobId is required');
    }
    await this.appService.rememberQuotaJob(
      body.jobId,
      body.userId,
      Number(body.cost ?? 0),
    );
  }

  @Post('quota/refund')
  @HttpCode(204)
  async refundQuota(
    @Body() body: { userId?: number; cost?: number },
    @Headers('x-internal-secret') secret?: string,
  ): Promise<void> {
    this.assertInternalSecret(secret);
    await this.appService.refundQuota(body?.userId, Number(body?.cost ?? 0));
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
