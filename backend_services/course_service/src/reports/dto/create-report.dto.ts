import { IsEnum, IsInt, IsString, MaxLength, Min, MinLength } from 'class-validator';
import { ReportTargetType } from 'src/models/report.model';

export class CreateReportDto {
  @IsEnum(ReportTargetType)
  targetType: ReportTargetType;

  @IsInt()
  @Min(1)
  targetId: number;

  @IsString()
  @MinLength(5)
  @MaxLength(2000)
  reason: string;
}
