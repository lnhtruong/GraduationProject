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

    async create(dto: CreateVideoDto, userId: number | undefined) {
        // const image = await this.mascotImageModel.findByPk(dto.image_id);
        // if (!image) {
        //     throw new BadRequestException('Mascot image does not exist');
        // }
        if (!userId) {
            throw new BadRequestException('userId does not exist');
        }

        return this.videoModel.create({
            user_id: userId,
            image_id: dto.image_id || null,
            type: dto.type ?? VideoType.MASCOT,
            url: dto.url,
            duration: dto.duration,
            srt_raw_url: dto.srt_raw_url ?? null,
        });
    }

    async findAll(user_id: number | undefined, type: string) {

        if (!user_id) {
            throw new BadRequestException('userId does not exist');
        }

        if (typeof type !== 'string' || type.trim().length === 0) {
            throw new BadRequestException('type does not exist');
        }

        const normalizedType = type.trim().toLowerCase();
        const allowedTypes = Object.values(VideoType);
        if (!allowedTypes.includes(normalizedType as VideoType)) {
            throw new BadRequestException(
                `Invalid type. Allowed: ${allowedTypes.join(', ')}`,
            );
        }

        return this.videoModel.findAll({
            where: { user_id, type: normalizedType as VideoType },
            include: [MascotImage],
            order: [['created_at', 'DESC']],
        });
    }

    async findOne(id: number) {
        const video = await this.videoModel.findByPk(id, {
            include: [MascotImage],
        });

        if (!video) {
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
            srt_raw_url: dto.srt_raw_url ?? video.srt_raw_url,
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

    async findByJobId(jobId: string) {
        return this.videoModel.findOne({ where: { job_id: jobId } });
    }
}
