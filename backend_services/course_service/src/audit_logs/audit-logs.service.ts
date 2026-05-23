import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { User } from 'src/users/user.model';
import { AuditLog } from './audit-log.model';

export interface AuditLogInput {
  actorUserId: number;
  actorRole: number;
  action: string;
  targetType?: string | null;
  targetId?: number | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  ip?: string | null;
  userAgent?: string | null;
}

export interface ListAuditLogsParams {
  actorId?: number;
  action?: string;
  targetType?: string;
  targetId?: number;
  from?: string;
  to?: string;
  cursor?: string;
  limit?: number;
}

@Injectable()
export class AuditLogsService {
  private readonly logger = new Logger(AuditLogsService.name);

  constructor(
    @InjectModel(AuditLog)
    private readonly auditLogModel: typeof AuditLog,
  ) {}

  // Fire-and-log: never throws — audit must not break the main action.
  async log(input: AuditLogInput): Promise<void> {
    try {
      await this.auditLogModel.create({
        actorUserId: input.actorUserId,
        actorRole: input.actorRole,
        action: input.action,
        targetType: input.targetType ?? null,
        targetId: input.targetId ?? null,
        before: input.before ?? null,
        after: input.after ?? null,
        metadata: input.metadata ?? null,
        ip: input.ip ?? null,
        userAgent: input.userAgent ?? null,
      });
    } catch (err) {
      this.logger.warn(
        `audit log failed for action=${input.action}: ${(err as Error).message}`,
      );
    }
  }

  async list(params: ListAuditLogsParams) {
    const safeLimit =
      Number.isInteger(params.limit) && (params.limit as number) > 0
        ? Math.min(params.limit as number, 100)
        : 20;

    const where: Record<string, unknown> = {};
    if (params.actorId) where.actorUserId = params.actorId;
    if (params.action) where.action = params.action;
    if (params.targetType) where.targetType = params.targetType;
    if (params.targetId) where.targetId = params.targetId;

    if (params.from || params.to) {
      const range: Record<symbol, Date> = {};
      if (params.from) {
        const d = new Date(params.from);
        if (!Number.isNaN(d.getTime())) range[Op.gte] = d;
      }
      if (params.to) {
        const d = new Date(params.to);
        if (!Number.isNaN(d.getTime())) range[Op.lte] = d;
      }
      if (Object.getOwnPropertySymbols(range).length > 0) {
        where.createdAt = range;
      }
    }

    if (params.cursor) {
      const cursorId = Number(params.cursor);
      if (Number.isInteger(cursorId) && cursorId > 0) {
        where.id = { [Op.lt]: cursorId };
      }
    }

    // Fetch limit+1 to know if there's a next page without a separate count query.
    const rows = await this.auditLogModel.findAll({
      where,
      include: [
        {
          model: User,
          as: 'actor',
          attributes: ['id', 'email', 'role'],
          required: false,
        },
      ],
      order: [['id', 'DESC']],
      limit: safeLimit + 1,
    });

    const hasMore = rows.length > safeLimit;
    const sliced = hasMore ? rows.slice(0, safeLimit) : rows;

    const items = sliced.map((row) => {
      const plain = row.get({ plain: true }) as Record<string, unknown> & {
        actor?: { id: number; email: string; role: number } | null;
        actorUserId: number;
        actorRole: number;
        createdAt: Date;
      };
      return {
        id: plain.id,
        actor: plain.actor
          ? {
              id: plain.actor.id,
              email: plain.actor.email,
              role: plain.actor.role,
            }
          : { id: plain.actorUserId, email: null, role: plain.actorRole },
        action: plain.action,
        targetType: plain.targetType,
        targetId: plain.targetId,
        before: plain.before,
        after: plain.after,
        metadata: plain.metadata,
        ip: plain.ip,
        userAgent: plain.userAgent,
        createdAt: plain.createdAt,
      };
    });

    const nextCursor =
      hasMore && items.length > 0
        ? String(items[items.length - 1].id)
        : null;

    return { items, nextCursor };
  }
}
