import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import quotaConfig from './quota.config';
import { QuotaService } from './quota.service';

@Module({
  imports: [ConfigModule.forFeature(quotaConfig)],
  providers: [QuotaService],
  exports: [QuotaService],
})
export class QuotaModule {}
