import { IsInt, Min } from 'class-validator';

export class CreateWishlistDto {
  @IsInt()
  @Min(1)
  courseId!: number;
}
