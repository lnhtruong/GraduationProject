import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import type { FindOptions } from 'sequelize';
// import { MascotImage } from './mascot-image.model';
import { CreateMascotImageDto } from 'src/dto/create-mascot-image.dto';
import { UpdateMascotImageDto } from 'src/dto/update-mascot-image.dto';
import { MascotImage, MascotImageType } from './images.model';

interface MascotImagePayload {
    user_id: number;
    url: string;
    type: MascotImageType;
}


@Injectable()
export class MascotImageService {
    constructor(
        @InjectModel(MascotImage)
        private readonly mascotImageModel: typeof MascotImage,
    ) { }

    async create(dto: CreateMascotImageDto, user_id: number | undefined) {
        const { url } = dto;
        if (user_id === undefined || !url) {
            throw new BadRequestException('Missing user_id or url');
        }
        const payload: MascotImagePayload = {
            ...dto,
            user_id,
            type: dto.type ?? MascotImageType.THUMBNAIL_VIDEO,
        };

        return this.mascotImageModel.create(payload as any);
    }

    async findAll(
        user_id: number | undefined,
        pagination: { page?: number; limit?: number } = {},
    ) {
        if (user_id === undefined) {
            throw new BadRequestException('Missing user_id');
        }

        const baseQuery: FindOptions = {
            where: { user_id },
            order: [['createdAt', 'DESC']],
        };

        const shouldPaginate = pagination.page !== undefined || pagination.limit !== undefined;
        if (!shouldPaginate) {
            return this.mascotImageModel.findAll(baseQuery);
        }

        const page = Number.isInteger(pagination.page) && (pagination.page as number) > 0
            ? pagination.page as number
            : 1;
        const limit = Number.isInteger(pagination.limit) && (pagination.limit as number) > 0
            ? Math.min(pagination.limit as number, 100)
            : 20;
        const offset = (page - 1) * limit;

        const { rows, count } = await this.mascotImageModel.findAndCountAll({
            ...baseQuery,
            limit,
            offset,
        });

        return {
            data: rows,
            pagination: {
                page,
                limit,
                totalItems: count,
                totalPages: count > 0 ? Math.ceil(count / limit) : 0,
            },
        };
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
