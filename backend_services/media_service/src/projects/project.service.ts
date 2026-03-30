import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
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

    async findAllByUser(user_id: number | undefined) {
        return this.projectModel.findAll({
            where: { user_id },
            order: [['updated_at', 'DESC']],
            include: [{ model: Video, required: false }],
        });
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
}


