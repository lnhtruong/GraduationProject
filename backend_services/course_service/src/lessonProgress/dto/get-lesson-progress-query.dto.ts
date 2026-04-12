import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';
import { PaginationQueryDto } from 'src/models/pagination.dto';

export class GetLessonProgressQueryDto extends PaginationQueryDto {
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  courseId?: number;
}
