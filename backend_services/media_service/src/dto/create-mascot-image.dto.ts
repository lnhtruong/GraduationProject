import { IsNumber, IsString } from 'class-validator';

export class CreateMascotImageDto {
    @IsNumber()
    user_id: number;

    @IsString()
    url: string;
}