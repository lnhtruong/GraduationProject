import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { MascotOverlay } from './mascot_overlay.model';
import { CreateMascotOverlayDto } from 'src/dto/create-mascot-overlay.dto';
import { UpdateMascotOverlayDto } from 'src/dto/update-mascot-overlay.dto';
// import { Video, VideoType } from 'src/videos/video.model';
import { Project } from 'src/projects/project.model';
import { MascotImage } from 'src/images_mascot/images.model';

@Injectable()
export class MascotOverlayService {
    constructor(
        @InjectModel(MascotOverlay)
        private readonly mascotOverlayModel: typeof MascotOverlay,
        // @InjectModel(Video)
        // private readonly videoModel: typeof Video,
        @InjectModel(Project)
        private readonly projectModel: typeof Project,
        @InjectModel(MascotImage)
        private readonly mascotImageModel: typeof MascotImage,

    ) { }

    async create(dto: CreateMascotOverlayDto) {
        const { edit_id } = dto;

        if (edit_id === undefined) {
            throw new BadRequestException('Missing required fields: edit_id');
        }

        const project = await this.projectModel.findByPk(edit_id);
        if (!project) {
            throw new BadRequestException('edit_id must reference a project');
        }

        return this.mascotOverlayModel.create(dto as any);
    }

    async findAllByEdit(edit_id: number) {
        const overlays = await this.mascotOverlayModel.findAll({
            where: { edit_id },
            order: [['created_at', 'DESC']],
        });

        return overlays;
    }

    async findOne(id: number) {
        const overlay = await this.mascotOverlayModel.findByPk(id, {
            include: [Project, MascotImage],
        });

        if (!overlay) {
            throw new NotFoundException('Mascot overlay not found');
        }

        return overlay;
    }

    async update(id: number, dto: UpdateMascotOverlayDto) {
        const overlay = await this.findOne(id);

        if (dto.edit_id !== undefined) {
            const project = await this.projectModel.findByPk(dto.edit_id);
            if (!project) {
                throw new BadRequestException('edit_id must reference a project');
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


