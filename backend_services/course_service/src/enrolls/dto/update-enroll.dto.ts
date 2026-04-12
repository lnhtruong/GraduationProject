import { IsDate, IsEnum, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { EnrollStatus } from 'src/models/enroll.model';

export class UpdateEnrollDto {
  @IsEnum(EnrollStatus)
  @IsOptional()
  status?: EnrollStatus;

  /** Set when marking completed manually; otherwise may be set by the service when progress reaches 100%. */
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  completedAt?: Date;
}
