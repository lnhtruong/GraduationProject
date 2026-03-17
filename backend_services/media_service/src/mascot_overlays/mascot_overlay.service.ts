import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { MascotOverlay } from './mascot_overlay.model';
import { CreateMascotOverlayDto } from 'src/dto/create-mascot-overlay.dto';
import { UpdateMascotOverlayDto } from 'src/dto/update-mascot-overlay.dto';
import { Video, VideoType } from 'src/videos/video.model';
import { Project } from 'src/projects/project.model';

@Injectable()
export class MascotOverlayService {
    constructor(
        @InjectModel(MascotOverlay)
        private readonly mascotOverlayModel: typeof MascotOverlay,
        @InjectModel(Video)
        private readonly videoModel: typeof Video,
    ) { }

    async create(dto: CreateMascotOverlayDto) {
        const { mascot_video_id } = dto;

        if (mascot_video_id === undefined) {
            throw new BadRequestException('Missing required fields');
        }

        const video = await this.videoModel.findByPk(mascot_video_id);
        if (!video || video.type !== VideoType.MASCOT) {
            throw new BadRequestException('mascot_video_id must reference a mascot video');
        }

        return this.mascotOverlayModel.create(dto as any);
    }

    async findAllByEdit(edit_id: number) {
        const overlays = await this.mascotOverlayModel.findAll({
            where: { edit_id },
            order: [['createdAt', 'DESC']],
        });

        return overlays;
    }

    async findOne(id: number) {
        const overlay = await this.mascotOverlayModel.findByPk(id, {
            include: [Video, Project],
        });

        if (!overlay) {
            throw new NotFoundException('Mascot overlay not found');
        }

        return overlay;
    }

    async update(id: number, dto: UpdateMascotOverlayDto) {
        const overlay = await this.findOne(id);

        if (dto.mascot_video_id !== undefined) {
            const video = await this.videoModel.findByPk(dto.mascot_video_id);
            if (!video || video.type !== VideoType.MASCOT) {
                throw new BadRequestException('mascot_video_id must reference a mascot video');
            }
        }

        await overlay.update(dto);
        return overlay;
    }

    async remove(id: number) {
        const overlay = await this.findOne(id);
        await overlay.destroy();
        return { message: 'Mascot overlay deleted successfully' };
    }
}


