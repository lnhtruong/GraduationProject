import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsOptional } from 'class-validator';

export class BulkUpdateNotificationsDto {
  @IsBoolean()
  is_read!: boolean;

  /** When true, updates every notification for the current user (ignores `ids`). */
  @IsOptional()
  @IsBoolean()
  all?: boolean;

  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  ids?: number[];
}
