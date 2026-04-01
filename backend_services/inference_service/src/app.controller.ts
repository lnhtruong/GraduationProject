import {
  Controller,
  Get,
  Post,
  Body,
  Param,
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

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  getHome() {
    return { message: 'Mascot Video Share Service API Gateway' };
  }

  // Map với /highlight-reel
  @Post('highlight-reel')
  @UseInterceptors(FileInterceptor('video'))
  async createHighlightReel(
    @UploadedFile() video: Express.Multer.File,
    @Body() body: unknown,
    @Headers('x-user-id') userIdHeader?: string,
  ): Promise<unknown> {
    if (!video) throw new BadRequestException('Video file is required');
    const userId =
      typeof userIdHeader === 'string' && userIdHeader.trim().length > 0
        ? Number(userIdHeader)
        : undefined;
    return this.appService.createHighlightReel(video, body, userId);
  }

  // Map với /mascot
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

    const userId =
      typeof userIdHeader === 'string' && userIdHeader.trim().length > 0
        ? Number(userIdHeader)
        : undefined;

    console.log('check userid: ', userId);

    return this.appService.createMascot(mascotImageUrl, audio, body, userId);
  }

  // Map với /generate-quiz
  @Post('generate-quiz')
  @UseInterceptors(NoFilesInterceptor())
  async generateQuiz(@Body() body: unknown): Promise<unknown> {
    return this.appService.generateQuiz(body);
  }

  // Map với /jobs/status/{job_id}
  @Get('jobs/status/:job_id')
  async getJobStatus(@Param('job_id') jobId: string, @Headers('x-user-id') userIdHeader?: string): Promise<unknown> {
    const userId =
      typeof userIdHeader === 'string' && userIdHeader.trim().length > 0
        ? Number(userIdHeader)
        : undefined;
    return this.appService.getJobStatus(jobId, userId);
  }

  // Map với /download/{job_id}
  @Get('download/:job_id')
  async downloadVideo(@Param('job_id') jobId: string, @Res() res: Response) {
    return this.appService.downloadVideo(jobId, res);
  }
}
