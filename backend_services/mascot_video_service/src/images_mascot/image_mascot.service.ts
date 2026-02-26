import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
// import { MascotImage } from './mascot-image.model';
import { CreateMascotImageDto } from 'src/dto/create-mascot-image.dto';
import { UpdateMascotImageDto } from 'src/dto/update-mascot-image.dto';
import { MascotImage } from './images.model';

interface MascotImagePayload {
    user_id: number;
    url: string;
}


@Injectable()
export class MascotImageService {
    constructor(
        @InjectModel(MascotImage)
        private readonly mascotImageModel: typeof MascotImage,
    ) { }

    async create(dto: CreateMascotImageDto) {
        const { user_id, url } = dto;
        if (user_id === undefined || !url) {
            throw new BadRequestException('Missing user_id or url');
        }
        const payload: MascotImagePayload = {
            ...dto
        };

        return this.mascotImageModel.create(payload as any);
    }

    async findAll(user_id: number) {
        return this.mascotImageModel.findAll({
            where: { user_id },
            order: [['createdAt', 'DESC']],
        });
    }

    async findOne(id: number) {
        const image = await this.mascotImageModel.findByPk(id, {
            include: ['videos'],
        });

        if (!image) {
            throw new NotFoundException('Mascot image not found');
        }

        return image;
    }

    async update(id: number, dto: UpdateMascotImageDto) {
        const image = await this.findOne(id);
        await image.update(dto);
        return image;
    }

    async remove(id: number) {
        const image = await this.findOne(id);
        await image.destroy();
        return { message: 'Mascot image deleted successfully' };
    }
}