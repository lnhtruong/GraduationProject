import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Headers,
    Query
} from '@nestjs/common';
import { VideoService } from './video.service';
import { CreateVideoDto } from 'src/dto/create-video.dto';
import { UpdateVideoDto } from 'src/dto/update-video.dto';

@Controller('videos')
export class VideoController {
    constructor(private readonly VideoService: VideoService) { }

    @Post()
    create(@Body() dto: CreateVideoDto, @Headers('x-user-id') userIdHeader?: string) {
        const userId =
            typeof userIdHeader === 'string' && userIdHeader.trim().length > 0
                ? Number(userIdHeader)
                : undefined;
        return this.VideoService.create(dto, userId);
    }

    @Get('user/:type')
    findAll(
        @Param('type') type: string,
        @Headers('x-user-id') userIdHeader?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('availableForFeed') availableForFeed?: string,
        @Query('includeFeedUsage') includeFeedUsage?: string,
    ) {
        const userId =
            typeof userIdHeader === 'string' && userIdHeader.trim().length > 0
                ? Number(userIdHeader)
                : undefined;
        return this.VideoService.findAll(userId, type, {
            page: page !== undefined ? Number(page) : undefined,
            limit: limit !== undefined ? Number(limit) : undefined,
            availableForFeed: this.parseBooleanQuery(availableForFeed),
            includeFeedUsage: this.parseBooleanQuery(includeFeedUsage),
        });
    }

    private parseBooleanQuery(value?: string): boolean {
        if (typeof value !== 'string') return false;
        return ['1', 'true', 'yes'].includes(value.trim().toLowerCase());
    }
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.VideoService.findOne(+id);
    }

    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() dto: UpdateVideoDto,
    ) {
        return this.VideoService.update(+id, dto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.VideoService.remove(+id);
    }
}
