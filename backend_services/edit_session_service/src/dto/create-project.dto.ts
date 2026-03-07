import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
// import { ProjectStatus } from 'src/projects/project.model';

export class CreateProjectDto {
    @IsInt()
    @Min(1)
    user_id: number;

    @IsInt()
    @Min(1)
    @IsOptional()
    highlight_id?: number;

    @IsString()
    session_name: string;

    //   @IsIn(['draft', 'saved', 'finalized'])
    //   @IsOptional()
    //   status?: ProjectStatus; // default draft nếu không truyền
}