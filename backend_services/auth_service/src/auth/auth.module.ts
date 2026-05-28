import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { JwtTokenModule } from './jwt/jwt.module';
import { RedisModule } from '../redis/redis.module';
import { RedisService } from '../redis/redis.service';
import { ForgotPasswordRateLimitGuard } from './guards/forgot-password-rate-limit.guard';

@Module({
  imports: [UsersModule, JwtTokenModule, RedisModule, HttpModule],
  controllers: [AuthController],
  providers: [AuthService, RedisService, ForgotPasswordRateLimitGuard],
  exports: [AuthService],
})
export class AuthModule { }
