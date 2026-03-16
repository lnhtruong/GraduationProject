import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Project, ProjectStatus } from './project.model';
import { CreateProjectDto } from 'src/dto/create-project.dto';
import { UpdateProjectDto } from 'src/dto/update-project.dto';

@Injectable()
export class ProjectService {
    constructor(
        @InjectModel(Project)
        private readonly projectModel: typeof Project,
    ) { }

    async create(dto: CreateProjectDto) {
        const { user_id, session_name } = dto;

        if (user_id === undefined || !session_name) {
            throw new BadRequestException('Missing user_id or session_name');
        }

        return this.projectModel.create({
            user_id: dto.user_id,
            highlight_id: dto.highlight_id ?? null,
            session_name: dto.session_name,
            status: ProjectStatus.DRAFT,
        } as any);
    }

    async findAllByUser(user_id: number) {
        return this.projectModel.findAll({
            where: { user_id },
            order: [['updated_at', 'DESC']],
        });
    }

    async findOne(edit_id: number) {
        const project = await this.projectModel.findByPk(edit_id);

        if (!project) {
            throw new NotFoundException('Project not found');
        }

        return project;
    }

    async update(edit_id: number, dto: UpdateProjectDto) {
        const project = await this.findOne(edit_id);

        await project.update({
            highlight_id: dto.highlight_id ?? project.highlight_id,
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


