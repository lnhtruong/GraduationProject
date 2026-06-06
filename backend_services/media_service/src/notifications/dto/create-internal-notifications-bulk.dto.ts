import { ArrayMaxSize, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateInternalNotificationDto } from './create-internal-notification.dto';

export class CreateInternalNotificationsBulkDto {
  @IsArray()
  @ArrayMaxSize(1000)
  @ValidateNested({ each: true })
  @Type(() => CreateInternalNotificationDto)
  items: CreateInternalNotificationDto[];
}
