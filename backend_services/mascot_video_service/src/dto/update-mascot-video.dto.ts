import { IsOptional, IsString, IsNumber } from 'class-validator';

export class UpdateMascotVideoDto {
    @IsOptional()
    @IsString()
    image_id?: string;

    @IsOptional()
    @IsString()
    url?: string;

    @IsOptional()
    @IsNumber()
    duration?: number;
}
