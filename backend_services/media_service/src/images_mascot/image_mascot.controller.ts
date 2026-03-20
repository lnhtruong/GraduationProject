import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Headers
} from '@nestjs/common';
import { CreateMascotImageDto } from 'src/dto/create-mascot-image.dto';
import { UpdateMascotImageDto } from 'src/dto/update-mascot-image.dto';
import { MascotImageService } from './image_mascot.service';

@Controller('mascot_images')
export class MascotImageController {
    constructor(private readonly mascotImageService: MascotImageService) { }

    @Post()
    create(@Body() dto: CreateMascotImageDto, @Headers('x-user-id') userIdHeader?: string) {
        const userId =
            typeof userIdHeader === 'string' && userIdHeader.trim().length > 0
                ? Number(userIdHeader)
                : undefined;
        return this.mascotImageService.create(dto, userId);
    }

    @Get('user')
    findAll(@Headers('x-user-id') userIdHeader?: string) {
        const userId =
            typeof userIdHeader === 'string' && userIdHeader.trim().length > 0
                ? Number(userIdHeader)
                : undefined;
        return this.mascotImageService.findAll(userId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.mascotImageService.findOne(+id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdateMascotImageDto) {
        return this.mascotImageService.update(+id, dto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.mascotImageService.remove(+id);
    }
}