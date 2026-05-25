import { registerAs } from '@nestjs/config';

export default registerAs('redis', () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT ?? '6379', 10) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB ?? '0', 10) || 0,
  // Job → colab mapping mặc định sống 7 ngày (đủ cho user poll status / download).
  jobTtlSeconds:
    parseInt(process.env.COLAB_JOB_TTL_SECONDS ?? '604800', 10) || 604800,
}));
