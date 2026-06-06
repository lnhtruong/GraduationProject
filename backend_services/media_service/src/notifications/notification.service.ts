import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { MessageEvent } from '@nestjs/common';
import { Op } from 'sequelize';
import { Notification } from 'src/models/notification.model';
import { SseService } from 'src/sse/sse.service';
import { PatchNotificationDto } from './dto/patch-notification.dto';
import { BulkUpdateNotificationsDto } from './dto/bulk-update-notifications.dto';
import {
  NotificationEventType,
  NotificationSourceType,
  NotificationSseEventType,
} from './notification.enums';

export type CreateNotificationInput = {
  userId: number;
  eventType: NotificationEventType;
  sseEventType: NotificationSseEventType;
  title: string;
  message?: string | null;
  payload?: Record<string, unknown>;
  sourceType?: NotificationSourceType;
  sourceId?: number;
};

const BULK_INSERT_CHUNK_SIZE = 200;

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification)
    private readonly notificationModel: typeof Notification,
    private readonly sseService: SseService,
  ) { }

  private buildCreatedEvent(
    notification: Notification | null,
    sseEventType: NotificationSseEventType,
    payload?: Record<string, unknown>,
    fallback?: { userId: number; title: string; message?: string | null;
                  sourceType?: NotificationSourceType; sourceId?: number;
                  eventType?: NotificationEventType },
  ): MessageEvent {
    // Khi notification không persist (vd VIDEO_JOB_PROGRESS) — build event từ fallback
    // để vẫn emit SSE đúng schema mà không touch DB.
    const notif = notification
      ? {
          id: notification.id,
          user_id: notification.user_id,
          event_type: notification.event_type,
          title: notification.title,
          message: notification.message,
          payload: notification.payload,
          is_read: notification.is_read,
          source_type: notification.source_type,
          source_id: notification.source_id,
          created_at: notification.get('created_at'),
        }
      : fallback
        ? {
            id: null,
            user_id: fallback.userId,
            event_type: fallback.eventType ?? null,
            title: fallback.title,
            message: fallback.message ?? null,
            payload: payload ?? null,
            is_read: false,
            source_type: fallback.sourceType ?? null,
            source_id: fallback.sourceId ?? null,
            created_at: new Date(),
          }
        : null;

    return {
      type: sseEventType,
      data: {
        success: true,
        notification: notif,
        data: payload ?? null,
        timestamp: new Date().toISOString(),
      },
    };
  }

  async createAndEmit(input: CreateNotificationInput): Promise<Notification | null> {
    // VIDEO_JOB_PROGRESS events spam quá nhiều (mỗi stage transition) → skip DB,
    // chỉ emit SSE. Đó là intent ban đầu — nhưng version cũ pass `undefined`
    // vào buildCreatedEvent → crash. Fix: build event từ input thay vì DB row.
    let notification: Notification | null = null;
    if (input.eventType !== NotificationEventType.VIDEO_JOB_PROGRESS) {
      notification = await this.notificationModel.create({
        user_id: input.userId,
        event_type: input.eventType,
        title: input.title,
        message: input.message ?? null,
        payload: input.payload ?? null,
        source_type: input.sourceType ?? null,
        source_id: input.sourceId ?? null,
        is_read: false,
      });
    }

    this.sseService.emitToUser(
      input.userId,
      this.buildCreatedEvent(notification, input.sseEventType, input.payload, {
        userId: input.userId,
        title: input.title,
        message: input.message,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        eventType: input.eventType,
      }),
    );
    return notification;
  }

  async createManyAndEmit(
    inputs: CreateNotificationInput[],
  ): Promise<Notification[]> {
    const createdRows: Notification[] = [];

    for (let i = 0; i < inputs.length; i += BULK_INSERT_CHUNK_SIZE) {
      const chunk = inputs.slice(i, i + BULK_INSERT_CHUNK_SIZE);
      const rows = await this.notificationModel.bulkCreate(
        chunk.map((input) => ({
          user_id: input.userId,
          event_type: input.eventType,
          title: input.title,
          message: input.message ?? null,
          payload: input.payload ?? null,
          source_type: input.sourceType ?? null,
          source_id: input.sourceId ?? null,
          is_read: false,
        })),
        { returning: true },
      );

      for (let index = 0; index < rows.length; index += 1) {
        const row = rows[index];
        const input = chunk[index];
        this.sseService.emitToUser(
          input.userId,
          this.buildCreatedEvent(row, input.sseEventType, input.payload),
        );
      }

      createdRows.push(...rows);
    }

    return createdRows;
  }

  toResponse(row: Notification) {
    return {
      id: row.id,
      user_id: row.user_id,
      event_type: row.event_type,
      title: row.title,
      message: row.message,
      payload: row.payload,
      is_read: row.is_read,
      source_type: row.source_type,
      source_id: row.source_id,
      created_at: row.get('created_at'),
      updated_at: row.get('updated_at'),
    };
  }

  async findAllForUser(
    userId: number,
    options: { cursor?: number; limit: number; isRead?: boolean },
  ) {
    const safeLimit =
      Number.isInteger(options.limit) && options.limit > 0
        ? Math.min(options.limit, 50)
        : 20;

    const where: Record<string, unknown> = { user_id: userId };
    if (typeof options.isRead === 'boolean') {
      where.is_read = options.isRead;
    }
    if (options.cursor) {
      where.id = { [Op.lt]: options.cursor };
    }

    const rows = await this.notificationModel.findAll({
      where,
      order: [['id', 'DESC']],
      limit: safeLimit,
    });

    const data = rows.map((row) => this.toResponse(row));
    return {
      data,
      next_cursor:
        data.length === safeLimit ? data[data.length - 1].id : null,
    };
  }

  async findOneForUser(userId: number, id: number): Promise<Notification> {
    const row = await this.notificationModel.findOne({
      where: { id, user_id: userId },
    });
    if (!row) {
      throw new NotFoundException('Notification not found');
    }
    return row;
  }

  async updateOneForUser(
    userId: number,
    id: number,
    dto: PatchNotificationDto,
  ): Promise<Notification> {
    const row = await this.findOneForUser(userId, id);
    row.is_read = dto.is_read;
    await row.save();
    return row;
  }

  async bulkUpdateForUser(
    userId: number,
    dto: BulkUpdateNotificationsDto,
  ): Promise<{ updated: number }> {
    if (dto.all) {
      const [updated] = await this.notificationModel.update(
        { is_read: dto.is_read },
        { where: { user_id: userId } },
      );
      return { updated };
    }

    const [updated] = await this.notificationModel.update(
      { is_read: dto.is_read },
      { where: { user_id: userId, id: { [Op.in]: dto.ids } } },
    );
    return { updated };
  }
}
