import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
} from '@nestjs/common';
import { MascotOverlayService } from './mascot_overlay.service';
import { CreateMascotOverlayDto } from 'src/dto/create-mascot-overlay.dto';
import { UpdateMascotOverlayDto } from 'src/dto/update-mascot-overlay.dto';

@Controller('mascot_overlays')
export class MascotOverlayController {
    constructor(private readonly mascotOverlayService: MascotOverlayService) { }

    @Post()
    create(@Body() dto: CreateMascotOverlayDto) {
        return this.mascotOverlayService.create(dto);
    }

    @Get('edit/:edit_id')
    findOneByEdit(@Param('edit_id') edit_id: string) {
        return this.mascotOverlayService.findOneByEdit(+edit_id);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.mascotOverlayService.findOne(+id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdateMascotOverlayDto) {
        return this.mascotOverlayService.update(+id, dto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.mascotOverlayService.remove(+id);
    }
}


