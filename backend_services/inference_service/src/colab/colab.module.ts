import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { ColabPoolService } from './colab-pool.service';
import { JobRegistryService } from './job-registry.service';
import colabConfig from '../config/colab.config';

@Module({
  imports: [ConfigModule.forFeature(colabConfig), HttpModule],
  providers: [ColabPoolService, JobRegistryService],
  exports: [ColabPoolService, JobRegistryService],
})
export class ColabModule {}
