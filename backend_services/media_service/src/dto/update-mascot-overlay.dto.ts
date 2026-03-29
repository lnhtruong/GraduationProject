import { IsInt, IsNumber, IsOptional, Min } from 'class-validator';
import { IsAfter } from 'src/validators/is-ater.validator';

export class UpdateMascotOverlayDto {
    @IsOptional()
    @IsInt()
    edit_id?: number;

    @IsOptional()
    @IsInt()
    image_id?: number;

    @IsOptional()
    @IsNumber()
    position_x?: number;

    @IsOptional()
    @IsNumber()
    position_y?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    scale?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    start_time?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @IsAfter('start_time', { message: 'end_time must be greater than start_time' })
    end_time?: number;

    @IsOptional()
    @IsInt()
    layer_index?: number;
}


