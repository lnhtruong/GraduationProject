export type QuotaFeature = "highlight" | "transcribe" | "quiz" | "mascot";

export interface FeatureCost {
  credits: number;
  /** true = `credits` tính cho mỗi phút video; false = giá cố định mỗi lần gọi. */
  perMinute: boolean;
}

export interface QuotaPricing {
  costs: Record<QuotaFeature, FeatureCost>;
  /** Trần thời lượng dùng để tính giá, tính bằng giây. */
  maxDurationSec: number;
}

export interface QuotaSnapshot {
  limit: number;
  used: number;
  remaining: number;
  /**
   * Thời điểm counter hết hạn, ISO UTC — ví dụ "2026-07-31T01:00:00.000Z".
   * null = chưa dùng credit nào, cửa sổ 24h chưa bắt đầu nên chưa có mốc reset.
   */
  resetAt: string | null;
  pricing: QuotaPricing;
}
