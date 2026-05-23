import { registerAs } from '@nestjs/config';

/**
 * Cấu hình pool các Colab worker (mỗi worker là 1 ngrok tunnel).
 *
 * Env hỗ trợ (theo độ ưu tiên):
 *   1. COLAB_API_URLS  : "https://a.ngrok.io,https://b.ngrok.io"   ← khuyến nghị
 *   2. COLAB_API_URL   : "https://a.ngrok.io"                       ← legacy, single
 *
 * Các tham số phụ:
 *   - COLAB_HEALTH_TIMEOUT_MS         : timeout cho mỗi lần probe health (default 3000ms)
 *   - COLAB_HEALTH_CACHE_TTL_MS       : in-memory cache cho health probe (default 5000ms)
 *   - COLAB_HEALTH_PATH               : path probe (default "/")
 *   - COLAB_REQUEST_TIMEOUT_MS        : timeout cho request forward thực tế (default 600000ms ~ 10 phút)
 */

export interface ColabConfig {
  urls: string[];
  healthTimeoutMs: number;
  healthCacheTtlMs: number;
  healthPath: string;
  requestTimeoutMs: number;
}

function parseUrls(): string[] {
  const multi = process.env.COLAB_API_URLS?.trim();
  if (multi) {
    return multi
      .split(',')
      .map((u) => u.trim().replace(/\/+$/, ''))
      .filter((u) => u.length > 0);
  }
  const single = process.env.COLAB_API_URL?.trim();
  if (single) return [single.replace(/\/+$/, '')];
  return [];
}

export default registerAs<ColabConfig>('colab', () => ({
  urls: parseUrls(),
  healthTimeoutMs:
    parseInt(process.env.COLAB_HEALTH_TIMEOUT_MS ?? '3000', 10) || 3000,
  healthCacheTtlMs:
    parseInt(process.env.COLAB_HEALTH_CACHE_TTL_MS ?? '5000', 10) || 5000,
  healthPath: process.env.COLAB_HEALTH_PATH || '/',
  requestTimeoutMs:
    parseInt(process.env.COLAB_REQUEST_TIMEOUT_MS ?? '600000', 10) || 600000,
}));
