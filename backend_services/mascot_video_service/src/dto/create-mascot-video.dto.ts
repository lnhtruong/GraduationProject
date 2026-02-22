import { IsNumber, IsString, IsNotEmpty } from 'class-validator';

export class CreateMascotVideoDto {
    @IsNumber()
    image_id: number;

    @IsString()
    @IsNotEmpty()
    url: string;

    @IsNumber()
    duration: number;
}
