import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.module';

@Injectable()
export class RedisService {
  constructor(
    @Inject(REDIS_CLIENT) private readonly redisClient: Redis,
    private readonly configService: ConfigService,
  ) {}

  async set(key: string, value: string, ttl?: number): Promise<void> {
    const defaultTtl = this.configService.get('redis.ttl');
    await this.redisClient.setex(key, ttl || defaultTtl, value);
  }

  async get(key: string): Promise<string | null> {
    return await this.redisClient.get(key);
  }

  async del(key: string): Promise<void> {
    await this.redisClient.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.redisClient.exists(key);
    return result === 1;
  }

  /**
   * Atomic INCR with EXPIRE applied only on the first hit, via Lua so the
   * counter cannot race against the TTL.
   * Returns the post-increment count.
   */
  async incrWithTtl(key: string, ttlSeconds: number): Promise<number> {
    const script = `
      local v = redis.call('INCR', KEYS[1])
      if v == 1 then
        redis.call('EXPIRE', KEYS[1], ARGV[1])
      end
      return v
    `;
    const result = await this.redisClient.eval(script, 1, key, ttlSeconds);
    return Number(result);
  }

  /** Remaining TTL in seconds; -1 if no expiry, -2 if missing. */
  async ttl(key: string): Promise<number> {
    return this.redisClient.ttl(key);
  }

  /** SET NX EX — returns true if the lock was newly acquired. */
  async setLock(key: string, value: string, ttlSeconds: number): Promise<boolean> {
    const result = await this.redisClient.set(key, value, 'EX', ttlSeconds, 'NX');
    return result === 'OK';
  }
}
