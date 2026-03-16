import { IsOptional, IsString } from 'class-validator';

export class UpdateMascotImageDto {
    @IsOptional()
    @IsString()
    url?: string;
}