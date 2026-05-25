import {
  Injectable,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ColabConfig } from '../config/colab.config';

interface HealthEntry {
  healthy: boolean;
  checkedAt: number;
  info?: Record<string, unknown>;
  error?: string;
}

export interface PoolStatus {
  total: number;
  healthy: number;
  workers: Array<{
    url: string;
    healthy: boolean;
    checkedAt: number | null;
    error?: string;
  }>;
}

/**
 * Quản lý pool các Colab worker (mỗi worker là 1 ngrok tunnel).
 *
 * Trách nhiệm:
 *   - Đọc env COLAB_API_URLS (fallback COLAB_API_URL).
 *   - Round-robin chọn worker.
 *   - Health-check (GET healthPath) trước khi pick, có cache in-memory ngắn
 *     để tránh probe mỗi request.
 *   - Trả về URL hoặc ném ServiceUnavailable nếu không có worker healthy.
 */
@Injectable()
export class ColabPoolService implements OnModuleInit {
  private readonly logger = new Logger(ColabPoolService.name);
  private readonly urls: string[];
  private readonly healthTimeoutMs: number;
  private readonly healthCacheTtlMs: number;
  private readonly healthPath: string;
  private cursor = 0;
  private readonly healthCache = new Map<string, HealthEntry>();

  constructor(
    config: ConfigService,
    private readonly httpService: HttpService,
  ) {
    const colab = config.get<ColabConfig>('colab');
    this.urls = colab?.urls ?? [];
    this.healthTimeoutMs = colab?.healthTimeoutMs ?? 3000;
    this.healthCacheTtlMs = colab?.healthCacheTtlMs ?? 5000;
    this.healthPath = colab?.healthPath ?? '/';
  }

  onModuleInit(): void {
    if (this.urls.length === 0) {
      this.logger.error(
        'ColabPoolService: no COLAB_API_URLS / COLAB_API_URL configured. ' +
          'Service sẽ trả 503 cho mọi request inference.',
      );
    } else {
      this.logger.log(
        `ColabPoolService: pool size = ${this.urls.length}\n` +
          this.urls.map((u, i) => `  [${i}] ${u}`).join('\n'),
      );
    }
  }

  getUrls(): readonly string[] {
    return this.urls;
  }

  /**
   * Chọn 1 worker healthy theo round-robin. Probe theo thứ tự, quay 1 vòng.
   * Throw ServiceUnavailableException nếu cả pool đều unhealthy.
   */
  async pickHealthy(): Promise<string> {
    if (this.urls.length === 0) {
      throw new ServiceUnavailableException(
        'No Colab workers configured (set COLAB_API_URLS env)',
      );
    }

    const startCursor = this.cursor;
    const tried: Array<{ url: string; error?: string }> = [];

    for (let i = 0; i < this.urls.length; i++) {
      const idx = (startCursor + i) % this.urls.length;
      const url = this.urls[idx];
      const entry = await this.checkHealthCached(url);
      if (entry.healthy) {
        // Advance cursor cho lần sau (round-robin)
        this.cursor = (idx + 1) % this.urls.length;
        this.logger.debug(`Picked Colab worker [${idx}] ${url}`);
        return url;
      }
      tried.push({ url, error: entry.error });
    }

    this.logger.error(
      `All ${this.urls.length} Colab workers are unhealthy:\n` +
        tried
          .map((t) => `  - ${t.url} :: ${t.error ?? 'unhealthy'}`)
          .join('\n'),
    );
    throw new ServiceUnavailableException({
      message: 'All Colab workers are unhealthy',
      tried,
    });
  }

  /**
   * Trả về snapshot health cho ops / debugging.
   * `force=true` để bỏ qua cache.
   */
  async getStatus(force = false): Promise<PoolStatus> {
    const workers = await Promise.all(
      this.urls.map(async (url) => {
        const entry = force
          ? await this.probe(url)
          : await this.checkHealthCached(url);
        return {
          url,
          healthy: entry.healthy,
          checkedAt: entry.checkedAt || null,
          error: entry.error,
        };
      }),
    );
    return {
      total: this.urls.length,
      healthy: workers.filter((w) => w.healthy).length,
      workers,
    };
  }

  private async checkHealthCached(url: string): Promise<HealthEntry> {
    const cached = this.healthCache.get(url);
    const now = Date.now();
    if (cached && now - cached.checkedAt < this.healthCacheTtlMs) {
      return cached;
    }
    return this.probe(url);
  }

  private async probe(url: string): Promise<HealthEntry> {
    const target = `${url}${this.healthPath}`;
    try {
      const resp = await firstValueFrom(
        this.httpService.get<unknown>(target, {
          timeout: this.healthTimeoutMs,
          // ngrok free tunnel hay chèn banner — header này bypass.
          headers: { 'ngrok-skip-browser-warning': 'true' },
          // 2xx được xem là healthy
          validateStatus: (s) => s >= 200 && s < 300,
        }),
      );
      const entry: HealthEntry = {
        healthy: true,
        checkedAt: Date.now(),
        info:
          resp.data && typeof resp.data === 'object'
            ? (resp.data as Record<string, unknown>)
            : undefined,
      };
      this.healthCache.set(url, entry);
      return entry;
    } catch (err) {
      const entry: HealthEntry = {
        healthy: false,
        checkedAt: Date.now(),
        error: (err as Error).message,
      };
      this.healthCache.set(url, entry);
      return entry;
    }
  }
}
