import { IsNumber, IsString } from 'class-validator';

export class CreateMascotImageDto {

    @IsString()
    url: string;
}