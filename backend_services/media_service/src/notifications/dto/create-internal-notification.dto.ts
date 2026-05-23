import {
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import {
  NotificationEventType,
  NotificationSourceType,
  NotificationSseEventType,
} from '../notification.enums';

export class CreateInternalNotificationDto {
  @IsInt()
  @Min(1)
  userId: number;

  @IsEnum(NotificationEventType)
  eventType: NotificationEventType;

  @IsEnum(NotificationSseEventType)
  sseEventType: NotificationSseEventType;

  @IsString()
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;

  @IsOptional()
  @IsEnum(NotificationSourceType)
  sourceType?: NotificationSourceType;

  @IsOptional()
  @IsInt()
  @Min(1)
  sourceId?: number;
}
