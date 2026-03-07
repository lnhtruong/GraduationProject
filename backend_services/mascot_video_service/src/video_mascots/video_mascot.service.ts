import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { MascotVideo } from './video_mascot.model';
import { CreateMascotVideoDto } from 'src/dto/create-mascot-video.dto';
import { UpdateMascotVideoDto } from 'src/dto/update-mascot-video.dto';
import { MascotImage } from 'src/images_mascot/images.model';

@Injectable()
export class MascotVideoService {
    constructor(
        @InjectModel(MascotVideo)
        private readonly mascotVideoModel: typeof MascotVideo,

        @InjectModel(MascotImage)
        private readonly mascotImageModel: typeof MascotImage,
    ) { }

    async create(dto: CreateMascotVideoDto) {
        if (dto.image_id) {
            const image = await this.mascotImageModel.findByPk(dto.image_id);
            if (!image) {
                throw new BadRequestException('Mascot image does not exist');
            }
        }
        return this.mascotVideoModel.create({
            image_id: dto.image_id,
            url: dto.url,
            duration: dto.duration,
        });
    }

    async findAll(user_id: number) {
        return this.mascotVideoModel.findAll({
            where: { user_id },
            include: [MascotImage],
            order: [['createdAt', 'DESC']],
        });
    }

    async findOne(id: number) {
        const video = await this.mascotVideoModel.findByPk(id, {
            include: [MascotImage],
        });

        if (!video) {
            throw new NotFoundException('Mascot video not found');
        }

        return video;
    }

    async update(id: number, dto: UpdateMascotVideoDto) {
        const video = await this.findOne(id);

        if (dto.image_id) {
            const image = await this.mascotImageModel.findByPk(dto.image_id);
            if (!image) {
                throw new BadRequestException('Mascot image does not exist');
            }
        }

        await video.update({
            url: dto.url ?? video.url,
            duration: dto.duration ?? video.duration,
        });

        return video;
    }

    async remove(id: number) {
        const video = await this.findOne(id);
        await video.destroy();

        return {
            message: 'Mascot video deleted successfully',
        };
    }
}
