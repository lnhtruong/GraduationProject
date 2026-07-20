import {
  Injectable,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

interface HealthEntry {
  healthy: boolean;
  checkedAt: number;
  info?: Record<string, unknown>;
  error?: string;
}

export interface ColabPoolOptions {
  /** Nhãn pool dùng cho log, vd "highlight" | "mascot". */
  label: string;
  urls: string[];
  healthTimeoutMs: number;
  healthCacheTtlMs: number;
  healthPath: string;
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
  private readonly logger: Logger;
  private readonly label: string;
  private readonly urls: string[];
  private readonly healthTimeoutMs: number;
  private readonly healthCacheTtlMs: number;
  private readonly healthPath: string;
  private cursor = 0;
  private readonly healthCache = new Map<string, HealthEntry>();

  constructor(
    options: ColabPoolOptions,
    private readonly httpService: HttpService,
  ) {
    this.label = options.label;
    this.urls = options.urls;
    this.healthTimeoutMs = options.healthTimeoutMs;
    this.healthCacheTtlMs = options.healthCacheTtlMs;
    this.healthPath = options.healthPath;
    this.logger = new Logger(`ColabPoolService:${options.label}`);
  }

  onModuleInit(): void {
    if (this.urls.length === 0) {
      this.logger.error(
        `[${this.label}] Không có worker nào được cấu hình (thiếu ` +
          `${this.label.toUpperCase()}_COLAB_API_URLS / _URL, hoặc COLAB_API_URLS legacy). ` +
          'Service sẽ trả 503 cho mọi request thuộc pool này.',
      );
    } else {
      this.logger.log(
        `[${this.label}] pool size = ${this.urls.length}\n` +
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
        `No Colab workers configured for pool "${this.label}" ` +
          `(set ${this.label.toUpperCase()}_COLAB_API_URLS env)`,
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
        this.logger.debug(`Picked [${this.label}] worker [${idx}] ${url}`);
        return url;
      }
      tried.push({ url, error: entry.error });
    }

    this.logger.error(
      `All ${this.urls.length} workers in pool "${this.label}" are unhealthy:\n` +
        tried
          .map((t) => `  - ${t.url} :: ${t.error ?? 'unhealthy'}`)
          .join('\n'),
    );
    throw new ServiceUnavailableException({
      message: `All Colab workers in pool "${this.label}" are unhealthy`,
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
