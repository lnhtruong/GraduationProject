import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
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

  async list(params: {
    page?: number;
    limit?: number;
    actorUserId?: number;
    action?: string;
    targetType?: string;
    targetId?: number;
    from?: string;
    to?: string;
  }) {
    const safePage =
      Number.isInteger(params.page) && (params.page as number) > 0
        ? (params.page as number)
        : 1;
    const safeLimit =
      Number.isInteger(params.limit) && (params.limit as number) > 0
        ? Math.min(params.limit as number, 100)
        : 20;
    const offset = (safePage - 1) * safeLimit;

    const where: Record<string, unknown> = {};
    if (params.actorUserId) where.actorUserId = params.actorUserId;
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

    const { rows, count } = await this.auditLogModel.findAndCountAll({
      where,
      order: [['id', 'DESC']],
      offset,
      limit: safeLimit,
    });

    return {
      items: rows.map((r) => r.get({ plain: true })),
      pagination: {
        page: safePage,
        limit: safeLimit,
        totalItems: count,
        totalPages: Math.ceil(count / safeLimit),
      },
    };
  }
}
