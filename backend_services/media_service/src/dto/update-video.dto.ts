import { IsOptional, IsString, IsNumber } from 'class-validator';

export class UpdateVideoDto {
    @IsOptional()
    @IsString()
    image_id?: number;

    @IsOptional()
    @IsString()
    url?: string;

    @IsOptional()
    @IsNumber()
    duration?: number;

    @IsOptional()
    @IsString()
    srt_raw_url?: string;

    @IsOptional()
    @IsString()
    editing_job_id?: string | null;
}
