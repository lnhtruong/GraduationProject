import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ReportStatus } from 'src/models/report.model';

export type ReviewDecision = ReportStatus.APPROVED | ReportStatus.REJECTED;

export class ReviewReportDto {
  @IsEnum(ReportStatus)
  decision: ReviewDecision;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  reviewNote?: string;

  // If true and decision is approved, ban the target entity (course/lesson/user).
  @IsOptional()
  @IsBoolean()
  banTarget?: boolean;
}
