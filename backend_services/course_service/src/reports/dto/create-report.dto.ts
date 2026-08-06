import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ReportCategory, ReportTargetType } from 'src/models/report.model';

export class CreateReportDto {
  @IsEnum(ReportTargetType)
  targetType: ReportTargetType;

  @IsInt()
  @Min(1)
  targetId: number;

  @IsEnum(ReportCategory)
  reportCategory: ReportCategory;

  @IsString()
  @MinLength(5)
  @MaxLength(2000)
  reason: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  evidenceImageIds?: number[];
}
