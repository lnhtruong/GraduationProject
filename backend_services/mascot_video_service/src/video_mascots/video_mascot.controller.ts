import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
} from '@nestjs/common';
import { MascotVideoService } from './video_mascot.service';
import { CreateMascotVideoDto } from 'src/dto/create-mascot-video.dto';
import { UpdateMascotVideoDto } from 'src/dto/update-mascot-video.dto';

@Controller('mascot_videos')
export class MascotVideoController {
    constructor(private readonly mascotVideoService: MascotVideoService) { }

    @Post()
    create(@Body() dto: CreateMascotVideoDto) {
        return this.mascotVideoService.create(dto);
    }

    @Get(':user_id')
    findAll(@Param('user_id') user_id: string) {
        return this.mascotVideoService.findAll(Number(user_id));
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.mascotVideoService.findOne(+id);
    }

    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() dto: UpdateMascotVideoDto,
    ) {
        return this.mascotVideoService.update(+id, dto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.mascotVideoService.remove(+id);
    }
}
