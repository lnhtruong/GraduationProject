import { IsEnum, IsOptional, IsString } from 'class-validator';
import { MascotImageType } from 'src/images_mascot/images.model';

export class UpdateMascotImageDto {
    @IsOptional()
    @IsString()
    url?: string;

    @IsOptional()
    @IsEnum(MascotImageType)
    type?: MascotImageType;
}
