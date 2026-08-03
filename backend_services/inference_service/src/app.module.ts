import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { RedisModule } from './redis/redis.module';
import { ColabModule } from './colab/colab.module';
import { QuotaModule } from './quota/quota.module';
import colabConfig from './config/colab.config';
import redisConfig from './config/redis.config';
import quotaConfig from './quota/quota.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [colabConfig, redisConfig, quotaConfig],
    }),
    HttpModule,
    RedisModule,
    ColabModule,
    QuotaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
