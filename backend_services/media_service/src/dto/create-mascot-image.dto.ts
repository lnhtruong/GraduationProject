import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { MascotImageType } from 'src/images_mascot/images.model';

export class CreateMascotImageDto {

    @IsString()
    url: string;

    @IsOptional()
    @IsEnum(MascotImageType)
    type?: MascotImageType;
}