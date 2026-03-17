import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Video, VideoType } from './video.model';
import { CreateVideoDto } from 'src/dto/create-video.dto';
import { UpdateVideoDto } from 'src/dto/update-video.dto';
import { MascotImage } from 'src/images_mascot/images.model';

@Injectable()
export class VideoService {
    constructor(
        @InjectModel(Video)
        private readonly videoModel: typeof Video,

        @InjectModel(MascotImage)
        private readonly mascotImageModel: typeof MascotImage,
    ) { }

    async create(dto: CreateVideoDto) {
        const image = await this.mascotImageModel.findByPk(dto.image_id);
        if (!image) {
            throw new BadRequestException('Mascot image does not exist');
        }

        return this.videoModel.create({
            user_id: image.user_id,
            image_id: dto.image_id,
            type: dto.type ?? VideoType.MASCOT,
            url: dto.url,
            duration: dto.duration,
        });
    }

    async findAll(user_id: number) {
        return this.videoModel.findAll({
            where: { user_id, type: VideoType.MASCOT },
            include: [MascotImage],
            order: [['created_at', 'DESC']],
        });
    }

    async findOne(id: number) {
        const video = await this.videoModel.findByPk(id, {
            include: [MascotImage],
        });

        if (!video || video.type !== VideoType.MASCOT) {
            throw new NotFoundException('Mascot video not found');
        }

        return video;
    }

    async update(id: number, dto: UpdateVideoDto) {
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
            image_id: dto.image_id ?? video.image_id,
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
