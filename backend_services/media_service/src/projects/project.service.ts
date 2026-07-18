import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import type { FindOptions, Order } from 'sequelize';
import { Project, ProjectStatus } from './project.model';
import { CreateProjectDto } from 'src/dto/create-project.dto';
import { UpdateProjectDto } from 'src/dto/update-project.dto';
import { Video } from 'src/videos/video.model';

@Injectable()
export class ProjectService {
    constructor(
        @InjectModel(Project)
        private readonly projectModel: typeof Project,
    ) { }

    async create(dto: CreateProjectDto, userId: number | undefined) {
        const { session_name } = dto;

        if (userId === undefined || !session_name) {
            throw new BadRequestException('Missing user_id or session_name');
        }

        return this.projectModel.create({
            user_id: userId,
            video_id: dto.video_id ?? null,
            session_name: dto.session_name,
            status: ProjectStatus.DRAFT,
        } as any);
    }

    async findAllByUser(
        user_id: number | undefined,
        query: {
            page?: number;
            limit?: number;
            search?: string;
            status?: string;
            sort?: string;
        } = {},
    ) {
        if (user_id === undefined) {
            throw new BadRequestException('Missing user_id');
        }

        const where: Record<string, unknown> = { user_id };
        const keyword = query.search?.trim();
        if (keyword) {
            const idKeyword = Number(keyword);
            where[Op.or as any] = [
                { session_name: { [Op.like]: `%${keyword}%` } },
                ...(Number.isInteger(idKeyword) && idKeyword > 0 ? [{ edit_id: idKeyword }] : []),
            ];
        }

        if (query.status && query.status !== 'all') {
            const normalizedStatus = query.status.trim().toLowerCase();
            if (!Object.values(ProjectStatus).includes(normalizedStatus as ProjectStatus)) {
                throw new BadRequestException(
                    `Invalid status. Allowed: ${Object.values(ProjectStatus).join(', ')}`,
                );
            }
            where.status = normalizedStatus;
        }

        const order = this.getProjectOrder(query.sort);
        const baseQuery: FindOptions = {
            where,
            order,
            include: [{ model: Video, required: false }],
        };

        const shouldPaginate = query.page !== undefined || query.limit !== undefined;
        if (!shouldPaginate) {
            return this.projectModel.findAll(baseQuery);
        }

        const page = Number.isInteger(query.page) && (query.page as number) > 0
            ? query.page as number
            : 1;
        const limit = Number.isInteger(query.limit) && (query.limit as number) > 0
            ? Math.min(query.limit as number, 100)
            : 12;
        const offset = (page - 1) * limit;

        const { rows, count } = await this.projectModel.findAndCountAll({
            ...baseQuery,
            limit,
            offset,
            distinct: true,
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

    async findOne(edit_id: number) {
        const project = await this.projectModel.findByPk(edit_id, {
            include: [{ model: Video, required: false }],
        });

        if (!project) {
            throw new NotFoundException('Project not found');
        }

        return project;
    }

    async update(edit_id: number, dto: UpdateProjectDto) {
        const project = await this.findOne(edit_id);

        await project.update({
            video_id: dto.video_id ?? project.video_id,
            session_name: dto.session_name ?? project.session_name,
            status: dto.status ?? project.status,
        });

        return project;
    }

    async remove(edit_id: number) {
        const project = await this.findOne(edit_id);
        await project.destroy();

        return { message: 'Project deleted successfully' };
    }

    private getProjectOrder(sort?: string): Order {
        switch (sort) {
            case 'updated_asc':
                return [['updated_at', 'ASC']];
            case 'name_asc':
                return [['session_name', 'ASC']];
            case 'name_desc':
                return [['session_name', 'DESC']];
            case 'updated_desc':
            default:
                return [['updated_at', 'DESC']];
        }
    }
}


