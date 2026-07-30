import type { QuotaFeature, QuotaPricing } from "./quota.types";

function hasDuration(durationSec: number | undefined): durationSec is number {
  return (
    durationSec !== undefined && Number.isFinite(durationSec) && durationSec > 0
  );
}

/** Số phút bị tính tiền: làm tròn lên, tối thiểu 1 phút, cắt trần maxDurationSec. */
function billableMinutes(durationSec: number, maxDurationSec: number): number {
  return Math.max(1, Math.ceil(Math.min(durationSec, maxDurationSec) / 60));
}

/**
 * Bản sao công thức tính giá của backend
 * (`inference_service/src/quota/quota.pricing.ts`). Bảng giá luôn lấy từ
 * `GET /mascot_colab/quota` nên không hardcode con số nào ở đây.
 */
export function calcCost(
  feature: QuotaFeature,
  durationSec: number | undefined,
  pricing: QuotaPricing,
): number {
  const cost = pricing.costs[feature];
  if (!cost) return 1;
  if (!cost.perMinute) return Math.max(1, cost.credits);

  const minutes = hasDuration(durationSec)
    ? billableMinutes(durationSec, pricing.maxDurationSec)
    : 1;

  return Math.max(1, cost.credits * minutes);
}

/**
 * Giải thích con số credit cho người dùng, ví dụ "10 credit/phút × 3 phút".
 * Chưa biết thời lượng thì chỉ nêu đơn giá, không bịa ra số phút.
 */
export function describeCost(
  feature: QuotaFeature,
  durationSec: number | undefined,
  pricing: QuotaPricing,
): string {
  const cost = pricing.costs[feature];
  if (!cost) return "";
  if (!cost.perMinute) return `${cost.credits} credit mỗi lần tạo`;

  const rate = `${cost.credits} credit/phút`;
  if (!hasDuration(durationSec)) return rate;

  const minutes = billableMinutes(durationSec, pricing.maxDurationSec);
  return `${rate} × ${minutes} phút`;
}

/** "2026-07-29T00:00:00+07:00" → "00:00". Chuỗi hỏng → "". */
export function formatResetAt(resetAtIso: string): string {
  const match = /T(\d{2}):(\d{2})/.exec(resetAtIso);
  if (!match) return "";
  return `${match[1]}:${match[2]}`;
}
