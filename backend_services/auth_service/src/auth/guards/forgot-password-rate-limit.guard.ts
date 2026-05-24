import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { RedisService } from '../../redis/redis.service';

const WINDOW_SECONDS = 15 * 60; // 15 minutes
const MAX_REQUESTS = 5;

@Injectable()
export class ForgotPasswordRateLimitGuard implements CanActivate {
  constructor(private readonly redisService: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    const ip = this.resolveClientIp(req);
    const key = `RATE_LIMIT:FORGOT_PASSWORD:IP:${ip}`;

    const count = await this.redisService.incrWithTtl(key, WINDOW_SECONDS);

    if (count > MAX_REQUESTS) {
      const ttl = await this.redisService.ttl(key);
      const retryAfter = ttl > 0 ? ttl : WINDOW_SECONDS;
      res.setHeader('Retry-After', retryAfter.toString());
      throw new HttpException(
        {
          success: false,
          message: 'Too many requests',
          retryAfter,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  private resolveClientIp(req: Request): string {
    // Behind the api_gateway, http-proxy-middleware forwards x-forwarded-for.
    // app.set('trust proxy', true) lets req.ip read it correctly.
    return req.ip ?? req.socket.remoteAddress ?? 'unknown';
  }
}
