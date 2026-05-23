import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import redisConfig from '../config/redis.config';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Global()
@Module({
  imports: [ConfigModule.forFeature(redisConfig)],
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (configService: ConfigService): Redis => {
        const cfg = configService.get<{
          host: string;
          port: number;
          password?: string;
          db: number;
        }>('redis');

        return new Redis({
          host: cfg?.host ?? 'localhost',
          port: cfg?.port ?? 6379,
          password: cfg?.password,
          db: cfg?.db ?? 0,
          // Cho phép service start kể cả khi Redis chưa sẵn sàng
          lazyConnect: false,
          maxRetriesPerRequest: 3,
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
