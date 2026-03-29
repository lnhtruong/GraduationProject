import { IsInt, IsNumber, Min, IsOptional } from 'class-validator';
import { IsAfter } from 'src/validators/is-ater.validator';

export class CreateMascotOverlayDto {
    @IsOptional()
    @IsInt()
    edit_id: number;

    @IsOptional()
    @IsInt()
    image_id: number;

    @IsNumber()
    position_x: number;

    @IsNumber()
    position_y: number;

    @IsNumber()
    @Min(0)
    scale: number;

    @IsNumber()
    @Min(0)
    start_time: number;

    @IsNumber()
    @Min(0)
    @IsAfter('start_time', { message: 'end_time must be greater than start_time' })
    end_time: number;

    @IsInt()
    layer_index: number;
}


