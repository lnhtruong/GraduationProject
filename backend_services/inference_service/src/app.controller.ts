import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Res,
  BadRequestException,
  Headers,
} from '@nestjs/common';
import {
  FileInterceptor,
  FileFieldsInterceptor,
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
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'mascot_image', maxCount: 1 },
      { name: 'audio', maxCount: 1 },
    ]),
  )
  async createMascotJob(
    @UploadedFiles()
    files: {
      mascot_image?: Express.Multer.File[];
      audio?: Express.Multer.File[];
    },
    @Body() body: unknown,
    @Headers('x-user-id') userIdHeader?: string,
  ): Promise<unknown> {
    if (!files || !files.mascot_image) {
      throw new BadRequestException('mascot_image is required');
    }
    const mascotImage = files.mascot_image[0];
    const audio = files.audio ? files.audio[0] : undefined;

    const userId =
      typeof userIdHeader === 'string' && userIdHeader.trim().length > 0
        ? Number(userIdHeader)
        : undefined;

    return this.appService.createMascot(mascotImage, audio, body, userId);
  }

  // Map với /generate-quiz
  @Post('generate-quiz')
  @UseInterceptors(NoFilesInterceptor())
  async generateQuiz(@Body() body: unknown): Promise<unknown> {
    return this.appService.generateQuiz(body);
  }

  // Map với /jobs/status/{job_id}
  @Get('jobs/status/:job_id')
  async getJobStatus(@Param('job_id') jobId: string): Promise<unknown> {
    return this.appService.getJobStatus(jobId);
  }

  // Map với /download/{job_id}
  @Get('download/:job_id')
  async downloadVideo(@Param('job_id') jobId: string, @Res() res: Response) {
    return this.appService.downloadVideo(jobId, res);
  }
}
