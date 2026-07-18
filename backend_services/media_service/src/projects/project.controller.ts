import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Headers,
    Query
} from '@nestjs/common';
import { ProjectService } from './project.service';
import { CreateProjectDto } from 'src/dto/create-project.dto';
import { UpdateProjectDto } from 'src/dto/update-project.dto';

@Controller('projects')
export class ProjectController {
    constructor(private readonly projectService: ProjectService) { }

    @Post()
    create(@Body() dto: CreateProjectDto, @Headers('x-user-id') userIdHeader?: string) {
        const userId =
            typeof userIdHeader === 'string' && userIdHeader.trim().length > 0
                ? Number(userIdHeader)
                : undefined;
        return this.projectService.create(dto, userId);
    }

    @Get('user')
    findAllByUser(
        @Headers('x-user-id') userIdHeader?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('search') search?: string,
        @Query('status') status?: string,
        @Query('sort') sort?: string,
    ) {
        const user_id =
            typeof userIdHeader === 'string' && userIdHeader.trim().length > 0
                ? Number(userIdHeader)
                : undefined;
        return this.projectService.findAllByUser(user_id, {
            page: page !== undefined ? Number(page) : undefined,
            limit: limit !== undefined ? Number(limit) : undefined,
            search,
            status,
            sort,
        });
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.projectService.findOne(+id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdateProjectDto) {
        return this.projectService.update(+id, dto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.projectService.remove(+id);
    }
}


