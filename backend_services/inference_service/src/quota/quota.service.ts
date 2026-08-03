import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

import { REDIS_CLIENT } from '../redis/redis.module';
import type { FeatureCost, QuotaConfig, QuotaFeature } from './quota.config';
import {
  calcCost,
  jobKey,
  quotaKey,
  resetAtIso,
  resolveLimit,
} from './quota.pricing';

export interface QuotaContext {
  userId?: number;
  role?: number;
  feature: QuotaFeature;
  durationSec?: number;
}

export interface QuotaSnapshot {
  limit: number;
  used: number;
  remaining: number;
  /** null = chưa dùng credit nào, cửa sổ 24h chưa bắt đầu nên chưa có mốc reset. */
  resetAt: string | null;
  pricing: {
    costs: Record<QuotaFeature, FeatureCost>;
    maxDurationSec: number;
  };
}

@Injectable()
export class QuotaService {
  private readonly logger = new Logger(QuotaService.name);
  private readonly cfg: QuotaConfig;

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    configService: ConfigService,
  ) {
    // QuotaModule đăng ký quotaConfig qua forFeature nên key này luôn có.
    // Thiếu = lỗi cấu hình; fail ngay lúc boot còn hơn âm thầm tính sai giá.
    const cfg = configService.get<QuotaConfig>('quota');
    if (!cfg) {
      throw new Error('Thiếu cấu hình "quota" — QuotaModule chưa được nạp');
    }
    this.cfg = cfg;
  }

  private price(feature: QuotaFeature, durationSec?: number): number {
    return calcCost(feature, durationSec, this.cfg);
  }

  /**
   * Trừ credit trước khi submit job. Trả về số credit đã trừ (0 = không trừ gì,
   * gọi refund với 0 là no-op). Ném HttpException 429 khi vượt hạn mức.
   *
   * Redis lỗi → fail-open: log warning và trả 0. Quota là lớp chống lạm dụng,
   * không phải lớp bảo mật; để một Redis blip làm chết tính năng là tệ hơn.
   */
  async reserve(ctx: QuotaContext): Promise<number> {
    if (!this.cfg.enabled || ctx.userId === undefined) return 0;

    const cost = this.price(ctx.feature, ctx.durationSec);
    const limit = resolveLimit(ctx.role, this.cfg);
    const now = new Date();
    const key = quotaKey(ctx.userId);

    let used: number;
    let pttlMs: number;
    try {
      // EXPIRE ... NX chỉ gắn TTL khi key chưa có hạn, tức đúng lần dùng đầu của
      // cửa sổ. Gia hạn ở mọi lần dùng thì người dùng thường xuyên sẽ không bao
      // giờ được reset.
      const res = await this.redis
        .multi()
        .incrby(key, cost)
        .expire(key, this.cfg.windowSeconds, 'NX')
        .pttl(key)
        .exec();
      used = Number(res?.[0]?.[1] ?? NaN);
      pttlMs = Number(res?.[2]?.[1] ?? -1);
    } catch (err) {
      this.logger.warn(
        `Quota check bị bỏ qua (Redis lỗi, userId=${ctx.userId}): ${(err as Error).message}`,
      );
      return 0;
    }

    if (!Number.isFinite(used)) {
      this.logger.warn(
        `Quota check bị bỏ qua (Redis trả kết quả lạ, userId=${ctx.userId})`,
      );
      return 0;
    }

    if (used > limit) {
      try {
        await this.redis.decrby(key, cost);
      } catch (err) {
        this.logger.warn(
          `Rollback quota thất bại (userId=${ctx.userId}): ${(err as Error).message}`,
        );
      }
      throw new HttpException(
        {
          error: 'QUOTA_EXCEEDED',
          message: 'Bạn đã dùng hết hạn mức AI',
          quota: {
            limit,
            used: used - cost,
            remaining: Math.max(0, limit - (used - cost)),
            cost,
            resetAt: resetAtIso(now, pttlMs),
          },
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return cost;
  }

  /**
   * Ghi lại credit đã trừ cho job vừa submit. Chỉ cần khi job đã được Colab
   * nhận — lúc đó `reserve` không còn cơ hội rollback nữa.
   */
  async rememberJob(
    jobId: string,
    userId: number | undefined,
    cost: number,
  ): Promise<void> {
    if (!this.cfg.enabled || userId === undefined || cost <= 0) return;
    try {
      await this.redis.set(
        jobKey(jobId),
        `${userId}:${cost}`,
        'EX',
        this.cfg.jobTtlSeconds,
      );
    } catch (err) {
      this.logger.warn(
        `Không ghi được record hoàn quota (jobId=${jobId}): ${(err as Error).message}`,
      );
    }
  }

  /**
   * Hoàn credit cho job đã chết trên Colab. GET + DEL trong một MULTI nên chỉ
   * lần gọi đầu đọc được record — FE poll bao nhiêu lần cũng chỉ hoàn một lần.
   */
  async refundJob(jobId: string): Promise<void> {
    if (!this.cfg.enabled) return;

    let raw: string | null;
    try {
      const key = jobKey(jobId);
      const res = await this.redis.multi().get(key).del(key).exec();
      raw = (res?.[0]?.[1] as string | null) ?? null;
    } catch (err) {
      this.logger.warn(
        `Đọc record hoàn quota thất bại (jobId=${jobId}): ${(err as Error).message}`,
      );
      return;
    }
    if (!raw) return;

    const [userIdRaw, costRaw] = raw.split(':');
    const userId = Number(userIdRaw);
    const cost = Number(costRaw);
    if (!Number.isFinite(userId) || !Number.isFinite(cost) || cost <= 0) return;

    await this.refund(userId, cost);
    this.logger.log(
      `Hoàn ${cost} credit cho userId=${userId} vì job ${jobId} thất bại`,
    );
  }

  /** Hoàn credit khi submit sang Colab thất bại đồng bộ. Best-effort. */
  async refund(userId: number | undefined, cost: number): Promise<void> {
    if (!this.cfg.enabled || userId === undefined || cost <= 0) return;
    const key = quotaKey(userId);
    try {
      // Cửa sổ có thể đã hết hạn trước khi job chết: DECRBY sẽ tạo lại key với
      // giá trị âm và không có TTL — biếu không credit vĩnh viễn. Về 0 hoặc âm
      // nghĩa là không còn gì để hoàn, xoá luôn cho cửa sổ neo lại từ đầu.
      const used = await this.redis.decrby(key, cost);
      if (used <= 0) await this.redis.del(key);
    } catch (err) {
      this.logger.warn(
        `Hoàn quota thất bại (userId=${userId}, cost=${cost}): ${(err as Error).message}`,
      );
    }
  }

  async peek(userId?: number, role?: number): Promise<QuotaSnapshot> {
    const limit = resolveLimit(role, this.cfg);
    const now = new Date();
    const pricing = {
      costs: this.cfg.costs,
      maxDurationSec: this.cfg.maxDurationSec,
    };

    let used = 0;
    let pttlMs = -1;
    if (userId !== undefined) {
      try {
        const key = quotaKey(userId);
        const res = await this.redis.multi().get(key).pttl(key).exec();
        const parsed = parseInt((res?.[0]?.[1] as string | null) ?? '0', 10);
        used = Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
        pttlMs = Number(res?.[1]?.[1] ?? -1);
      } catch (err) {
        this.logger.warn(
          `Đọc quota thất bại (userId=${userId}): ${(err as Error).message}`,
        );
      }
    }

    return {
      limit,
      used,
      remaining: Math.max(0, limit - used),
      resetAt: resetAtIso(now, pttlMs),
      pricing,
    };
  }
}
