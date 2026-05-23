import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.module';

/**
 * Lưu mapping `jobId → colabUrl` trong Redis để mọi instance inference_service
 * đều có thể route GET /jobs/status/:jobId và GET /download/:jobId đến đúng
 * Colab worker đã nhận POST gốc.
 *
 * Key shape: colab:job:{jobId} -> "<colab_base_url>"
 */
@Injectable()
export class JobRegistryService {
  private readonly logger = new Logger(JobRegistryService.name);
  private readonly keyPrefix = 'colab:job:';
  private readonly ttlSeconds: number;

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    config: ConfigService,
  ) {
    this.ttlSeconds =
      config.get<number>('redis.jobTtlSeconds') ?? 7 * 24 * 60 * 60;
  }

  private key(jobId: string): string {
    return `${this.keyPrefix}${jobId}`;
  }

  async bind(jobId: string, colabUrl: string): Promise<void> {
    if (!jobId || !colabUrl) return;
    try {
      await this.redis.setex(this.key(jobId), this.ttlSeconds, colabUrl);
    } catch (err) {
      this.logger.warn(
        `Failed to persist job→colab mapping (jobId=${jobId}): ${(err as Error).message}`,
      );
    }
  }

  async resolve(jobId: string): Promise<string | null> {
    try {
      return await this.redis.get(this.key(jobId));
    } catch (err) {
      this.logger.warn(
        `Failed to read job→colab mapping (jobId=${jobId}): ${(err as Error).message}`,
      );
      return null;
    }
  }

  async forget(jobId: string): Promise<void> {
    try {
      await this.redis.del(this.key(jobId));
    } catch {
      // best-effort
    }
  }
}
