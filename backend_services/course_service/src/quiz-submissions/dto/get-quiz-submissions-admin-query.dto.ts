import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';
import { PaginationQueryDto } from 'src/models/pagination.dto';

export class GetQuizSubmissionsAdminQueryDto extends PaginationQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  quizId?: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  userId?: number;
}
