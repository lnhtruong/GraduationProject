import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  Get,
  HttpCode,
  Param,
  Post,
} from '@nestjs/common';
import { BunnyService } from './bunny.service';

@Controller('bunny')
export class BunnyController {
  constructor(private readonly bunnyService: BunnyService) { }

  @Post('videos/init-upload')
  @HttpCode(200)
  async initUpload(@Body() body: any, @Headers('x-user-id') userIdHeader?: string) {
    const userId =
      typeof userIdHeader === 'string' && userIdHeader.trim().length > 0
        ? Number(userIdHeader)
        : undefined;
    return this.bunnyService.initUpload(body, userId);
  }

  @Get('videos/:bunnyVideoId/status')
  async getStatus(@Param('bunnyVideoId') bunnyVideoId: string) {
    if (!bunnyVideoId) {
      throw new BadRequestException('Missing bunnyVideoId');
    }
    return this.bunnyService.getVideoStatus(bunnyVideoId);
  }

  @Get('videos/:bunnyVideoId/play-data')
  async getPlayData(@Param('bunnyVideoId') bunnyVideoId: string) {
    if (!bunnyVideoId) {
      throw new BadRequestException('Missing bunnyVideoId');
    }
    return this.bunnyService.getPlayData(bunnyVideoId);
  }
}

