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
}
