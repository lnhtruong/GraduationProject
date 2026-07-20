import { registerAs } from '@nestjs/config';

/**
 * Cấu hình 2 pool Colab worker riêng biệt theo loại tác vụ:
 *   - highlight : notebook 03_07_multi_output (transcribe, highlight-reel,
 *                 highlight-reel-link, generate-quiz)
 *   - mascot    : notebook RemoveBackground_Mascot (/mascot, /download)
 *
 * Env hỗ trợ cho mỗi pool (theo độ ưu tiên):
 *   1. HIGHLIGHT_COLAB_API_URLS / MASCOT_COLAB_API_URLS : "https://a.ngrok.io,https://b.ngrok.io"
 *   2. HIGHLIGHT_COLAB_API_URL  / MASCOT_COLAB_API_URL  : "https://a.ngrok.io"  ← single
 *   3. COLAB_API_URLS / COLAB_API_URL                    : legacy, dùng chung cho
 *      pool nào chưa migrate sang biến riêng.
 *
 * Các tham số phụ (dùng chung cho cả 2 pool):
 *   - COLAB_HEALTH_TIMEOUT_MS         : timeout cho mỗi lần probe health (default 3000ms)
 *   - COLAB_HEALTH_CACHE_TTL_MS       : in-memory cache cho health probe (default 5000ms)
 *   - COLAB_HEALTH_PATH               : path probe (default "/")
 *   - COLAB_REQUEST_TIMEOUT_MS        : timeout cho request forward thực tế (default 600000ms ~ 10 phút)
 */

export interface ColabConfig {
  highlightUrls: string[];
  mascotUrls: string[];
  healthTimeoutMs: number;
  healthCacheTtlMs: number;
  healthPath: string;
  requestTimeoutMs: number;
}

function parseList(raw: string | undefined): string[] {
  const trimmed = raw?.trim();
  if (!trimmed) return [];
  return trimmed
    .split(',')
    .map((u) => u.trim().replace(/\/+$/, ''))
    .filter((u) => u.length > 0);
}

function parseLegacyUrls(): string[] {
  const multi = parseList(process.env.COLAB_API_URLS);
  if (multi.length) return multi;
  const single = process.env.COLAB_API_URL?.trim();
  return single ? [single.replace(/\/+$/, '')] : [];
}

function resolveUrls(
  multiEnv: string,
  singleEnv: string,
  legacy: string[],
): string[] {
  const multi = parseList(process.env[multiEnv]);
  if (multi.length) return multi;
  const single = process.env[singleEnv]?.trim();
  if (single) return [single.replace(/\/+$/, '')];
  return legacy;
}

export default registerAs<ColabConfig>('colab', () => {
  const legacy = parseLegacyUrls();
  return {
    highlightUrls: resolveUrls(
      'HIGHLIGHT_COLAB_API_URLS',
      'HIGHLIGHT_COLAB_API_URL',
      legacy,
    ),
    mascotUrls: resolveUrls(
      'MASCOT_COLAB_API_URLS',
      'MASCOT_COLAB_API_URL',
      legacy,
    ),
    healthTimeoutMs:
      parseInt(process.env.COLAB_HEALTH_TIMEOUT_MS ?? '3000', 10) || 3000,
    healthCacheTtlMs:
      parseInt(process.env.COLAB_HEALTH_CACHE_TTL_MS ?? '5000', 10) || 5000,
    healthPath: process.env.COLAB_HEALTH_PATH || '/',
    requestTimeoutMs:
      parseInt(process.env.COLAB_REQUEST_TIMEOUT_MS ?? '600000', 10) ||
      600000,
  };
});
