import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
} from '@nestjs/common';
import { VideoService } from './video.service';
import { CreateVideoDto } from 'src/dto/create-video.dto';
import { UpdateVideoDto } from 'src/dto/update-video.dto';

@Controller('videos')
export class VideoController {
    constructor(private readonly VideoService: VideoService) { }

    @Post()
    create(@Body() dto: CreateVideoDto) {
        return this.VideoService.create(dto);
    }

    @Get('user/:user_id')
    findAll(@Param('user_id') user_id: string) {
        return this.VideoService.findAll(Number(user_id));
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
