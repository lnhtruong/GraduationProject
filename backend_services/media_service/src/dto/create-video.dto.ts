import { IsNumber, IsString, IsNotEmpty, IsIn } from 'class-validator';
import { VideoType } from 'src/videos/video.model';

export class CreateVideoDto {
    @IsNumber()
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
}
