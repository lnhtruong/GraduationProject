import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import type { FindOptions } from 'sequelize';

import { Video, VideoType } from './video.model';
import { CreateVideoDto } from 'src/dto/create-video.dto';
import { UpdateVideoDto } from 'src/dto/update-video.dto';
import { MascotImage } from 'src/images_mascot/images.model';
import { HighlightFeed } from 'src/models/highlight_feed.model';

@Injectable()
export class VideoService {
    constructor(
        @InjectModel(Video)
        private readonly videoModel: typeof Video,

        @InjectModel(MascotImage)
        private readonly mascotImageModel: typeof MascotImage,

        @InjectModel(HighlightFeed)
        private readonly highlightFeedModel: typeof HighlightFeed,
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

    async findAll(
        user_id: number | undefined,
        type: string,
        pagination: { page?: number; limit?: number; availableForFeed?: boolean; includeFeedUsage?: boolean } = {},
    ) {

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

        const where: Record<string, unknown> = {
            user_id,
            type: normalizedType as VideoType,
        };

        const shouldResolveFeedUsage = pagination.availableForFeed || pagination.includeFeedUsage;
        const usedVideoIds = shouldResolveFeedUsage
            ? await this.findFeedVideoIds()
            : [];
        const usedVideoIdSet = new Set(usedVideoIds);

        if (pagination.availableForFeed && usedVideoIds.length > 0) {
            where.id = { [Op.notIn]: usedVideoIds };
        }

        const baseQuery: FindOptions = {
            where,
            include: [MascotImage],
            order: [['created_at', 'DESC']],
        };

        const shouldPaginate = pagination.page !== undefined || pagination.limit !== undefined;
        if (!shouldPaginate) {
            const rows = await this.videoModel.findAll(baseQuery);
            return pagination.includeFeedUsage
                ? this.withFeedUsage(rows, usedVideoIdSet)
                : rows;
        }

        const page = Number.isInteger(pagination.page) && (pagination.page as number) > 0
            ? pagination.page as number
            : 1;
        const limit = Number.isInteger(pagination.limit) && (pagination.limit as number) > 0
            ? Math.min(pagination.limit as number, 100)
            : 20;
        const offset = (page - 1) * limit;

        const { rows, count } = await this.videoModel.findAndCountAll({
            ...baseQuery,
            limit,
            offset,
            distinct: true,
        });

        return {
            data: pagination.includeFeedUsage ? this.withFeedUsage(rows, usedVideoIdSet) : rows,
            pagination: {
                page,
                limit,
                totalItems: count,
                totalPages: count > 0 ? Math.ceil(count / limit) : 0,
            },
        };
    }

    private withFeedUsage(rows: Video[], usedVideoIdSet: Set<number>) {
        return rows.map((row) => {
            const videoId = Number(row.id);

            return {
                ...row.get({ plain: true }),
                is_used_in_feed: usedVideoIdSet.has(videoId),
            };
        });
    }

    private async findFeedVideoIds(): Promise<number[]> {
        const feeds = await this.highlightFeedModel.findAll({
            attributes: ['video_id'],
            raw: true,
        });

        return feeds
            .map((feed) => Number(feed.video_id))
            .filter((videoId) => Number.isInteger(videoId) && videoId > 0);
    }

    async findOne(id: number) {
        const video = await this.videoModel.findByPk(id, {
            include: [MascotImage],
        });

        if (!video) {
            throw new NotFoundException('Video not found');
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
