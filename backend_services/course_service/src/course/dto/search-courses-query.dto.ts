import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { CourseLevel } from 'src/models/course.model';
import { PaginationQueryDto } from 'src/models/pagination.dto';

export type CourseSearchSort =
  | 'newest'
  | 'popular'
  | 'rating'
  | 'price_asc'
  | 'price_desc';

export class SearchCoursesQueryDto extends PaginationQueryDto {
  @IsString()
  @IsOptional()
  q?: string;

  @Transform(({ value }) => {
    if (value === undefined) return undefined;
    const values = Array.isArray(value) ? value : [value];
    return values.map((item) => Number(item));
  })
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  @IsOptional()
  categoryIds?: number[];

  @IsEnum(CourseLevel)
  @IsOptional()
  level?: CourseLevel;

  @Type(() => Number)
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @Min(0)
  @IsOptional()
  minPrice?: number;

  @Type(() => Number)
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @Min(0)
  @IsOptional()
  maxPrice?: number;

  @Type(() => Number)
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @Min(0)
  @Max(5)
  @IsOptional()
  minRating?: number;

  @IsIn(['newest', 'popular', 'rating', 'price_asc', 'price_desc'])
  @IsOptional()
  sort?: CourseSearchSort = 'newest';
}
