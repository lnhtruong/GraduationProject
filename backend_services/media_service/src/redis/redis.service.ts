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

  async zAdd(key: string, score: number, member: string): Promise<void> {
    await this.redisClient.zadd(key, score.toString(), member);
  }

  async zRangeByScore(key: string, min: number, max: number, limit?: number): Promise<string[]> {
    if (typeof limit === 'number') {
      return await this.redisClient.zrangebyscore(key, min, max, 'LIMIT', 0, limit);
    }
    return await this.redisClient.zrangebyscore(key, min, max);
  }

  async zRemRangeByScore(key: string, min: number, max: number): Promise<void> {
    await this.redisClient.zremrangebyscore(key, min, max);
  }

  async sAdd(key: string, members: string[]): Promise<void> {
    if (members.length === 0) {
      return;
    }
    await this.redisClient.sadd(key, ...members);
  }

  async sMembers(key: string): Promise<string[]> {
    return await this.redisClient.smembers(key);
  }

  async sRem(key: string, members: string[]): Promise<void> {
    if (members.length === 0) {
      return;
    }
    await this.redisClient.srem(key, ...members);
  }

  /**
   * Replace an entire sorted set atomically and (optionally) attach a TTL.
   * Used for storing pre-ranked recommendation lists where the score is the
   * recommendation score (higher = better).
   */
  async zReplace(
    key: string,
    members: Array<{ score: number; value: string }>,
    ttl?: number,
  ): Promise<void> {
    const pipeline = this.redisClient.pipeline();
    pipeline.del(key);
    if (members.length > 0) {
      // ioredis ZADD signature accepts: zadd(key, score1, member1, score2, member2, ...)
      const args: string[] = [];
      for (const { score, value } of members) {
        args.push(String(score), value);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (pipeline as any).zadd(key, ...args);
    }
    if (ttl && ttl > 0) {
      pipeline.expire(key, ttl);
    }
    await pipeline.exec();
  }

  /**
   * Read members ordered by score DESC (highest score first).
   */
  async zRevRange(
    key: string,
    start: number,
    stop: number,
  ): Promise<string[]> {
    return await this.redisClient.zrevrange(key, start, stop);
  }

  async zRevRank(key: string, member: string): Promise<number | null> {
    return await this.redisClient.zrevrank(key, member);
  }

  async zCard(key: string): Promise<number> {
    return await this.redisClient.zcard(key);
  }

  async zRem(key: string, members: string[]): Promise<void> {
    if (members.length === 0) {
      return;
    }
    await this.redisClient.zrem(key, ...members);
  }

  /**
   * Iterate keys matching a glob pattern without blocking Redis (SCAN-based).
   */
  async scanKeys(pattern: string, count = 200): Promise<string[]> {
    const results: string[] = [];
    let cursor = '0';
    do {
      const [next, batch] = await this.redisClient.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        count,
      );
      cursor = next;
      if (batch.length > 0) {
        results.push(...batch);
      }
    } while (cursor !== '0');
    return results;
  }

  async delMany(keys: string[]): Promise<void> {
    if (keys.length === 0) {
      return;
    }
    await this.redisClient.del(...keys);
  }

  /**
   * Best-effort distributed lock. Returns true if the lock was acquired.
   */
  async acquireLock(key: string, ttlSeconds: number): Promise<boolean> {
    const result = await this.redisClient.set(key, '1', 'EX', ttlSeconds, 'NX');
    return result === 'OK';
  }

  async releaseLock(key: string): Promise<void> {
    await this.redisClient.del(key);
  }

  async incrementBy(key: string, delta: number, ttl?: number): Promise<number> {
    const value = await this.redisClient.incrby(key, delta);
    if (ttl && ttl > 0) {
      await this.redisClient.expire(key, ttl);
    }
    return value;
  }
}
