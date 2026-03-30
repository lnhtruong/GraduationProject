import { IsNumber, IsString, IsNotEmpty, IsIn, IsOptional } from 'class-validator';
import { VideoType } from 'src/videos/video.model';

export class CreateVideoDto {
    @IsNumber()
    @IsOptional()
    image_id: number;

    @IsString()
    @IsNotEmpty()
    url: string;

    @IsNumber()
    duration: number;

    @IsString()
    @IsNotEmpty()
    @IsIn(Object.values(VideoType))
    type: VideoType;

    @IsOptional()
    @IsString()
    srt_raw_url?: string;
}
