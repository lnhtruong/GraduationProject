import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule, HttpService } from '@nestjs/axios';
import { ColabPoolService } from './colab-pool.service';
import { JobRegistryService } from './job-registry.service';
import colabConfig, { ColabConfig } from '../config/colab.config';

export const HIGHLIGHT_COLAB_POOL = 'HIGHLIGHT_COLAB_POOL';
export const MASCOT_COLAB_POOL = 'MASCOT_COLAB_POOL';

function makePool(
  label: string,
  urls: string[],
  colab: ColabConfig | undefined,
  http: HttpService,
): ColabPoolService {
  return new ColabPoolService(
    {
      label,
      urls,
      healthTimeoutMs: colab?.healthTimeoutMs ?? 3000,
      healthCacheTtlMs: colab?.healthCacheTtlMs ?? 5000,
      healthPath: colab?.healthPath ?? '/',
    },
    http,
  );
}

@Module({
  imports: [ConfigModule.forFeature(colabConfig), HttpModule],
  providers: [
    {
      provide: HIGHLIGHT_COLAB_POOL,
      useFactory: (config: ConfigService, http: HttpService) => {
        const colab = config.get<ColabConfig>('colab');
        return makePool('highlight', colab?.highlightUrls ?? [], colab, http);
      },
      inject: [ConfigService, HttpService],
    },
    {
      provide: MASCOT_COLAB_POOL,
      useFactory: (config: ConfigService, http: HttpService) => {
        const colab = config.get<ColabConfig>('colab');
        return makePool('mascot', colab?.mascotUrls ?? [], colab, http);
      },
      inject: [ConfigService, HttpService],
    },
    JobRegistryService,
  ],
  exports: [HIGHLIGHT_COLAB_POOL, MASCOT_COLAB_POOL, JobRegistryService],
})
export class ColabModule {}
