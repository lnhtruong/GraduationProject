import type { QuotaConfig, QuotaFeature } from './quota.config';

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

/**
 * Counter của một người dùng. Không gắn ngày lịch: cửa sổ 24h được neo bằng TTL
 * đặt ở lần trừ credit đầu tiên, và Redis tự xoá key khi hết hạn.
 */
export function quotaKey(userId: number): string {
  return `quota:ai:${userId}`;
}

/** Ghi nhớ credit đã trừ cho một job, để hoàn lại nếu job chết trên Colab. */
export function jobKey(jobId: string): string {
  return `quota:job:${jobId}`;
}

/**
 * Thời điểm counter hết hạn, dạng ISO UTC. `pttlMs` là kết quả PTTL của Redis:
 * giá trị âm nghĩa là người dùng chưa tiêu credit nào nên cửa sổ 24h chưa bắt
 * đầu. Lúc đó chưa có mốc reset nào tồn tại — trả null chứ không bịa ra
 * "bây giờ + 24h", vì mốc thật chỉ được neo ở lần trừ credit đầu tiên.
 */
export function resetAtIso(now: Date, pttlMs: number): string | null {
  if (pttlMs <= 0) return null;
  return new Date(now.getTime() + pttlMs).toISOString();
}
