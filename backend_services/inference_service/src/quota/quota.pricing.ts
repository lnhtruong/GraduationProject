import type { QuotaConfig, QuotaFeature } from './quota.config';

/** Dịch thời điểm sang "giờ tường" của múi giờ offsetHours để lấy ngày lịch. */
function shift(now: Date, offsetHours: number): Date {
  return new Date(now.getTime() + offsetHours * 3600_000);
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function offsetLabel(offsetHours: number): string {
  const sign = offsetHours >= 0 ? '+' : '-';
  return `${sign}${pad(Math.abs(offsetHours))}:00`;
}

/**
 * Số phút bị tính tiền: mỗi phút bắt đầu tính trọn (làm tròn lên), tối thiểu 1
 * phút, và cắt trần ở `maxDurationSec`. Thời lượng thiếu/không hợp lệ → 1 phút.
 */
export function billableMinutes(
  durationSec: number | undefined,
  cfg: QuotaConfig,
): number {
  if (
    durationSec === undefined ||
    !Number.isFinite(durationSec) ||
    durationSec <= 0
  ) {
    return 1;
  }
  const clamped = Math.min(durationSec, cfg.maxDurationSec);
  return Math.max(1, Math.ceil(clamped / 60));
}

export function calcCost(
  feature: QuotaFeature,
  durationSec: number | undefined,
  cfg: QuotaConfig,
): number {
  const cost = cfg.costs[feature];
  if (!cost) return 1;
  const multiplier = cost.perMinute ? billableMinutes(durationSec, cfg) : 1;
  return Math.max(1, cost.credits * multiplier);
}

export function resolveLimit(
  role: number | undefined,
  cfg: QuotaConfig,
): number {
  if (role === undefined || !Number.isFinite(role)) return cfg.defaultLimit;
  return cfg.dailyLimits[role] ?? cfg.defaultLimit;
}

export function dayKey(userId: number, now: Date, offsetHours: number): string {
  const d = shift(now, offsetHours);
  const date = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
  return `quota:ai:${userId}:${date}`;
}

/** Ghi nhớ credit đã trừ cho một job, để hoàn lại nếu job chết trên Colab. */
export function jobKey(jobId: string): string {
  return `quota:job:${jobId}`;
}

/** Thời điểm 00:00 ngày hôm sau theo múi giờ đã cấu hình, dạng ISO có offset. */
export function resetAtIso(now: Date, offsetHours: number): string {
  const d = shift(now, offsetHours);
  d.setUTCDate(d.getUTCDate() + 1);
  const date = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
  return `${date}T00:00:00${offsetLabel(offsetHours)}`;
}
