import {
  Body,
  Controller,
  Get,
  HttpCode,
  Patch,
  Post,
  Put,
  Param,
  Query,
  Headers,
  ParseIntPipe,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { PatchNotificationDto } from './dto/patch-notification.dto';
import { BulkUpdateNotificationsDto } from './dto/bulk-update-notifications.dto';
import { CreateInternalNotificationDto } from './dto/create-internal-notification.dto';
import { CreateInternalNotificationsBulkDto } from './dto/create-internal-notifications-bulk.dto';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  private parseUserId(header?: string): number {
    const userId = Number(header);
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new UnauthorizedException('Authentication required');
    }
    return userId;
  }

  private assertInternalSecret(secret?: string): void {
    const expected = process.env.INTERNAL_SERVICE_SECRET;
    if (expected && expected !== secret) {
      throw new UnauthorizedException('Invalid internal secret');
    }
  }

  // Server-to-server endpoint. Not exposed via api_gateway — other services
  // call media_service directly (e.g. http://localhost:8003/notifications/internal).
  // Optional shared-secret check via INTERNAL_SERVICE_SECRET env var.
  @Post('internal')
  @HttpCode(201)
  async createInternal(
    @Headers('x-internal-secret') secret: string | undefined,
    @Body() body: CreateInternalNotificationDto,
  ) {
    this.assertInternalSecret(secret);

    const row = await this.notificationService.createAndEmit({
      userId: body.userId,
      eventType: body.eventType,
      sseEventType: body.sseEventType,
      title: body.title,
      message: body.message ?? null,
      payload: body.payload,
      sourceType: body.sourceType,
      sourceId: body.sourceId,
    });
    // row có thể null nếu event là VIDEO_JOB_PROGRESS (skip persist).
    // Internal API hiện không dùng cho progress event, nhưng vẫn handle defensively.
    if (!row) {
      return { success: true, persisted: false };
    }
    return this.notificationService.toResponse(row);
  }

  @Post('internal/bulk')
  @HttpCode(201)
  async createInternalBulk(
    @Headers('x-internal-secret') secret: string | undefined,
    @Body() body: CreateInternalNotificationsBulkDto,
  ) {
    this.assertInternalSecret(secret);

    const rows = await this.notificationService.createManyAndEmit(
      body.items.map((item) => ({
        userId: item.userId,
        eventType: item.eventType,
        sseEventType: item.sseEventType,
        title: item.title,
        message: item.message ?? null,
        payload: item.payload,
        sourceType: item.sourceType,
        sourceId: item.sourceId,
      })),
    );

    return {
      data: rows.map((row) => this.notificationService.toResponse(row)),
      created: rows.length,
    };
  }

  @Get()
  async list(
    @Headers('x-user-id') userIdHeader: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
    @Query('is_read') isRead?: string,
  ) {
    const userId = this.parseUserId(userIdHeader);
    const cursorId = cursor ? parseInt(cursor, 10) : undefined;
    const limitNum = limit ? parseInt(limit, 10) : 20;

    let isReadFilter: boolean | undefined;
    if (isRead === 'true') isReadFilter = true;
    else if (isRead === 'false') isReadFilter = false;

    return this.notificationService.findAllForUser(userId, {
      cursor: cursorId && !Number.isNaN(cursorId) ? cursorId : undefined,
      limit: limitNum,
      isRead: isReadFilter,
    });
  }

  @Put('bulk')
  async bulkUpdate(
    @Headers('x-user-id') userIdHeader: string,
    @Body() body: BulkUpdateNotificationsDto,
  ) {
    const userId = this.parseUserId(userIdHeader);
    if (!body.all && (!body.ids || body.ids.length === 0)) {
      throw new BadRequestException('Provide `ids` or set `all: true`');
    }
    return this.notificationService.bulkUpdateForUser(userId, body);
  }

  @Get(':id')
  async getOne(
    @Headers('x-user-id') userIdHeader: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const userId = this.parseUserId(userIdHeader);
    const row = await this.notificationService.findOneForUser(userId, id);
    return this.notificationService.toResponse(row);
  }

  @Patch(':id')
  async patchOne(
    @Headers('x-user-id') userIdHeader: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: PatchNotificationDto,
  ) {
    const userId = this.parseUserId(userIdHeader);
    const row = await this.notificationService.updateOneForUser(userId, id, body);
    return this.notificationService.toResponse(row);
  }
}
