import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { MascotOverlay } from './mascot_overlay.model';
import { CreateMascotOverlayDto } from 'src/dto/create-mascot-overlay.dto';
import { UpdateMascotOverlayDto } from 'src/dto/update-mascot-overlay.dto';
import { MascotVideo } from './video_mascot.model';
import { Project } from 'src/projects/project.model';
// import { MascotImage } from './mascot-image.model';
// import { CreateMascotImageDto } from 'src/dto/create-mascot-overlay.dto';
// import { UpdateMascotImageDto } from 'src/dto/update-mascot-overlay.dto';
// import { MascotImage } from './mascot_overlay.model';

interface MascotOverlayPayload {
    user_id: number;
    url: string;
}


@Injectable()
export class MascotOverlayService {
    constructor(
        @InjectModel(MascotOverlay)
        private readonly mascotOverlayModel: typeof MascotOverlay,
    ) { }

    async create(dto: CreateMascotOverlayDto) {
        const {
            mascot_video_id,
            // position_x,
            // position_y,
            // scale,
            // start_time,
            // end_time,
            // layer_index,
        } = dto;

        if (mascot_video_id === undefined) {
            throw new BadRequestException('Missing required fields');
        }

        return this.mascotOverlayModel.create(dto as any);
    }

    async findOneByEdit(edit_id: number) {
        const overlay = await this.mascotOverlayModel.findOne({
            where: { edit_id },
        });

        if (!overlay) {
            throw new NotFoundException('Mascot overlay not found for this project');
        }

        return overlay;
    }

    async findOne(id: number) {
        const overlay = await this.mascotOverlayModel.findByPk(id, {
            include: [MascotVideo, Project],
        });

        if (!overlay) {
            throw new NotFoundException('Mascot overlay not found');
        }

        return overlay;
    }

    async update(id: number, dto: UpdateMascotOverlayDto) {
        const overlay = await this.findOne(id);
        await overlay.update(dto);
        return overlay;
    }

    async remove(id: number) {
        const overlay = await this.findOne(id);
        await overlay.destroy();
        return { message: 'Mascot overlay deleted successfully' };
    }
}