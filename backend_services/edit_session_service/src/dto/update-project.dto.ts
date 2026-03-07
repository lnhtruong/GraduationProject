import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateProjectDto {
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @IsOptional()
    highlight_id?: number;

    @IsString()
    @IsOptional()
    session_name?: string;

    @IsIn(['draft', 'saved', 'finalized'])
    @IsOptional()
    status?: 'draft' | 'saved' | 'finalized';
}