import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from 'src/models/pagination.dto';

export class SearchCoursesQueryDto extends PaginationQueryDto {
  @IsString()
  @IsOptional()
  q?: string;
}
