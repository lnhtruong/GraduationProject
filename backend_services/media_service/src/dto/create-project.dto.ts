import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateProjectDto {
    @IsInt()
    @Min(1)
    user_id: number;

    @IsInt()
    @Min(1)
    @IsOptional()
    video_id?: number;

    @IsString()
    session_name: string;
}


